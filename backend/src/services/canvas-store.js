'use strict';

const crypto = require('crypto');
const { loadState, saveState } = require('../database');
const { createDefaultWeeks, createInitialAppState, generateCourseId } = require('../default-state');

const VALID_ACTIVITY_TYPES = new Set([
  'presentation',
  'groupe',
  'demonstration',
  'exercice-individuel',
  'recherche',
  'jeu',
  'synthese',
  'evaluation'
]);

const HALF_DAY_SLOTS = [
  { id: 'monday-am', dayOffset: 0 },
  { id: 'monday-pm', dayOffset: 0 },
  { id: 'tuesday-am', dayOffset: 1 },
  { id: 'tuesday-pm', dayOffset: 1 }
];

const HALF_DAY_SLOT_MAP = new Map(HALF_DAY_SLOTS.map((slot) => [slot.id, slot]));
const DEFAULT_HALF_DAY_SLOT = HALF_DAY_SLOTS[0] ? HALF_DAY_SLOTS[0].id : '';

const HALF_DAY_VALUES = new Set(['am', 'pm']);

const ISO_DATE_REGEX = /^(\d{4})-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

async function getState() {
  const raw = await loadState();
  const normalized = normalizeState(raw);
  return normalized;
}

async function replaceState(candidate) {
  const normalized = normalizeState(candidate);
  await saveState(normalized);
  return normalized;
}

async function listCourses() {
  const state = await getState();
  return state.courses;
}

async function getCourse(courseId) {
  const state = await getState();
  const course = state.courses.find((item) => item.id === courseId);
  if (!course) {
    return null;
  }
  return course;
}

async function createCourse(payload = {}) {
  const state = await getState();
  const { name, weeks } = payload;
  const course = normalizeCourse(
    {
      id: generateCourseId(),
      name,
      weeks: Array.isArray(weeks) ? weeks : createDefaultWeeks()
    },
    state.courses.length
  );
  state.courses.push(course);
  state.activeCourseId = course.id;
  await saveState(state);
  return course;
}

async function updateCourse(courseId, updates = {}) {
  const state = await getState();
  const course = state.courses.find((item) => item.id === courseId);
  if (!course) {
    return null;
  }
  if (typeof updates.name === 'string') {
    const trimmed = updates.name.trim();
    if (trimmed) {
      course.name = trimmed;
    }
  }
  if (updates.active === true) {
    state.activeCourseId = course.id;
  }
  normalizeCourse(course);
  ensureValidActiveCourse(state);
  await saveState(state);
  return course;
}

async function deleteCourse(courseId) {
  const state = await getState();
  const index = state.courses.findIndex((item) => item.id === courseId);
  if (index === -1) {
    return false;
  }
  state.courses.splice(index, 1);
  ensureStateHasAtLeastOneCourse(state);
  ensureValidActiveCourse(state);
  await saveState(state);
  return true;
}

async function setActiveCourse(courseId) {
  const state = await getState();
  const exists = state.courses.some((item) => item.id === courseId);
  if (!exists) {
    return null;
  }
  state.activeCourseId = courseId;
  await saveState(state);
  return courseId;
}

async function addWeek(courseId, payload = {}) {
  const state = await getState();
  const course = state.courses.find((item) => item.id === courseId);
  if (!course) {
    return null;
  }
  const week = normalizeWeek(
    {
      id: payload.id || generateWeekId(),
      name: payload.name,
      startDate: payload.startDate,
      startHalfDay: payload.startHalfDay,
      activities: Array.isArray(payload.activities) ? payload.activities : []
    },
    course.weeks.length
  );
  course.weeks.push(week);
  await saveState(state);
  return week;
}

async function updateWeek(courseId, weekId, updates = {}) {
  const state = await getState();
  const course = state.courses.find((item) => item.id === courseId);
  if (!course) {
    return null;
  }
  const week = course.weeks.find((item) => item.id === weekId);
  if (!week) {
    return null;
  }
  if (typeof updates.name === 'string') {
    const trimmed = updates.name.trim();
    if (trimmed) {
      week.name = trimmed;
    }
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'startDate')) {
    week.startDate = normalizeWeekStartDate(updates.startDate);
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'startHalfDay')) {
    week.startHalfDay = normalizeHalfDay(updates.startHalfDay);
  }
  if (Array.isArray(updates.activities)) {
    week.activities = updates.activities.map((activity) => normalizeActivity(activity, week.startDate));
  }
  await saveState(state);
  return week;
}

async function deleteWeek(courseId, weekId) {
  const state = await getState();
  const course = state.courses.find((item) => item.id === courseId);
  if (!course) {
    return false;
  }
  const index = course.weeks.findIndex((item) => item.id === weekId);
  if (index === -1) {
    return false;
  }
  course.weeks.splice(index, 1);
  await saveState(state);
  return true;
}

async function addActivity(courseId, weekId, payload = {}) {
  const state = await getState();
  const course = state.courses.find((item) => item.id === courseId);
  if (!course) {
    return null;
  }
  const week = course.weeks.find((item) => item.id === weekId);
  if (!week) {
    return null;
  }
  const activity = normalizeActivity(
    {
      id: payload.id || generateActivityId(),
      slot: payload.slot,
      type: payload.type,
      duration: payload.duration,
      material: payload.material,
      description: payload.description,
      date: payload.date
    },
    week.startDate
  );
  week.activities.push(activity);
  await saveState(state);
  return activity;
}

async function updateActivity(courseId, weekId, activityId, updates = {}) {
  const state = await getState();
  const course = state.courses.find((item) => item.id === courseId);
  if (!course) {
    return null;
  }
  const week = course.weeks.find((item) => item.id === weekId);
  if (!week) {
    return null;
  }
  const activity = week.activities.find((item) => item.id === activityId);
  if (!activity) {
    return null;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'slot')) {
    activity.slot = normalizeSlotId(updates.slot);
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'type')) {
    activity.type = normalizeActivityType(updates.type);
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'duration')) {
    activity.duration = sanitizeString(updates.duration);
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'material')) {
    activity.material = sanitizeString(updates.material);
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'description')) {
    activity.description = sanitizeMultiline(updates.description);
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'date')) {
    activity.date = sanitizeDateString(updates.date);
  }
  await saveState(state);
  return activity;
}

async function deleteActivity(courseId, weekId, activityId) {
  const state = await getState();
  const course = state.courses.find((item) => item.id === courseId);
  if (!course) {
    return false;
  }
  const week = course.weeks.find((item) => item.id === weekId);
  if (!week) {
    return false;
  }
  const index = week.activities.findIndex((item) => item.id === activityId);
  if (index === -1) {
    return false;
  }
  week.activities.splice(index, 1);
  await saveState(state);
  return true;
}

function ensureStateHasAtLeastOneCourse(state) {
  if (state.courses.length > 0) {
    return;
  }
  const fallback = createInitialAppState();
  state.activeCourseId = fallback.activeCourseId;
  state.courses = fallback.courses;
}

function ensureValidActiveCourse(state) {
  const exists = state.courses.some((course) => course.id === state.activeCourseId);
  if (!exists) {
    state.activeCourseId = state.courses.length > 0 ? state.courses[0].id : '';
  }
}

function normalizeState(rawState) {
  if (!rawState || typeof rawState !== 'object') {
    return createInitialAppState();
  }
  const normalized = { ...rawState };
  const rawCourses = Array.isArray(rawState.courses) ? rawState.courses : [];
  const courses = rawCourses.map((course, index) => normalizeCourse(course, index)).filter(Boolean);
  if (courses.length === 0) {
    const fallback = createInitialAppState();
    return fallback;
  }
  normalized.courses = courses;
  normalized.activeCourseId = typeof rawState.activeCourseId === 'string' ? rawState.activeCourseId : '';
  ensureValidActiveCourse(normalized);
  return normalized;
}

function normalizeCourse(rawCourse, index = 0) {
  if (!rawCourse || typeof rawCourse !== 'object') {
    const fallback = createDefaultCourse(index);
    return fallback;
  }
  const id = typeof rawCourse.id === 'string' && rawCourse.id.trim() ? rawCourse.id.trim() : generateCourseId();
  const name = typeof rawCourse.name === 'string' && rawCourse.name.trim()
    ? rawCourse.name.trim()
    : `Cours ${index + 1}`;
  const weeksArray = Array.isArray(rawCourse.weeks) ? rawCourse.weeks : createDefaultWeeks();
  const weeks = weeksArray.map((week, weekIndex) => normalizeWeek(week, weekIndex)).filter(Boolean);
  return {
    id,
    name,
    weeks
  };
}

function normalizeWeek(rawWeek, index = 0) {
  if (!rawWeek || typeof rawWeek !== 'object') {
    return {
      id: generateWeekId(),
      name: `Semaine ${index + 1}`,
      startDate: '',
      startHalfDay: 'am',
      activities: []
    };
  }
  const id = typeof rawWeek.id === 'string' && rawWeek.id.trim() ? rawWeek.id.trim() : generateWeekId();
  const name = typeof rawWeek.name === 'string' && rawWeek.name.trim() ? rawWeek.name.trim() : `Semaine ${index + 1}`;
  const startDate = normalizeWeekStartDate(rawWeek.startDate);
  const startHalfDay = normalizeHalfDay(rawWeek.startHalfDay);
  const activitiesArray = Array.isArray(rawWeek.activities) ? rawWeek.activities : [];
  const activities = activitiesArray
    .map((activity) => normalizeActivity(activity, startDate))
    .filter(Boolean);
  return {
    id,
    name,
    startDate,
    startHalfDay,
    activities
  };
}

function normalizeActivity(rawActivity, weekStartDate) {
  if (!rawActivity || typeof rawActivity !== 'object') {
    return null;
  }
  const id = typeof rawActivity.id === 'string' && rawActivity.id.trim() ? rawActivity.id.trim() : generateActivityId();
  const slot = normalizeSlotId(rawActivity.slot);
  const type = normalizeActivityType(rawActivity.type);
  const duration = sanitizeString(rawActivity.duration);
  const material = sanitizeString(rawActivity.material);
  const description = sanitizeMultiline(rawActivity.description);
  const date = sanitizeDateString(rawActivity.date) || sanitizeDateString(weekStartDate);
  return {
    id,
    slot,
    type,
    duration,
    material,
    description,
    date
  };
}

function normalizeSlotId(value) {
  if (typeof value !== 'string') {
    return DEFAULT_HALF_DAY_SLOT;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return DEFAULT_HALF_DAY_SLOT;
  }
  return HALF_DAY_SLOT_MAP.has(trimmed) ? trimmed : DEFAULT_HALF_DAY_SLOT;
}

function normalizeActivityType(value) {
  if (typeof value !== 'string') {
    return 'presentation';
  }
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) {
    return 'presentation';
  }
  return VALID_ACTIVITY_TYPES.has(trimmed) ? trimmed : 'presentation';
}

function normalizeWeekStartDate(value) {
  if (typeof value !== 'string') {
    return '';
  }
  const trimmed = value.trim();
  if (!trimmed || !ISO_DATE_REGEX.test(trimmed)) {
    return '';
  }
  return trimmed;
}

function normalizeHalfDay(value) {
  if (typeof value !== 'string') {
    return 'am';
  }
  const trimmed = value.trim().toLowerCase();
  if (!HALF_DAY_VALUES.has(trimmed)) {
    return 'am';
  }
  return trimmed;
}

function sanitizeString(value) {
  if (typeof value !== 'string') {
    return '';
  }
  return value.trim();
}

function sanitizeMultiline(value) {
  if (typeof value !== 'string') {
    return '';
  }
  return value.trim();
}

function sanitizeDateString(value) {
  if (typeof value !== 'string') {
    return '';
  }
  const trimmed = value.trim();
  if (!trimmed || !ISO_DATE_REGEX.test(trimmed)) {
    return '';
  }
  return trimmed;
}

function generateWeekId() {
  return `week-${createRandomIdSegment(8)}`;
}

function generateActivityId() {
  return `act-${createRandomIdSegment(10)}`;
}

function createRandomIdSegment(length) {
  if (typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID().replace(/-/g, '').slice(0, length);
  }
  return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
}

function createDefaultCourse(index) {
  return {
    id: generateCourseId(),
    name: `Cours ${index + 1}`,
    weeks: createDefaultWeeks()
  };
}

module.exports = {
  addActivity,
  addWeek,
  createCourse,
  deleteActivity,
  deleteCourse,
  deleteWeek,
  getCourse,
  getState,
  listCourses,
  replaceState,
  setActiveCourse,
  updateActivity,
  updateCourse,
  updateWeek
};
