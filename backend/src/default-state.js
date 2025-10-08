'use strict';

const DEFAULT_WEEKS_COUNT = 5;

function generateCourseId() {
  return `course-${Math.random().toString(36).slice(2, 6)}${Date.now().toString(36)}`;
}

function createDefaultWeeks() {
  return Array.from({ length: DEFAULT_WEEKS_COUNT }, (_, index) => ({
    id: `week-${index + 1}`,
    name: `Semaine ${index + 1}`,
    startDate: '',
    startHalfDay: 'am',
    activities: []
  }));
}

function createInitialAppState() {
  const courseId = generateCourseId();
  return {
    activeCourseId: courseId,
    courses: [
      {
        id: courseId,
        name: 'Cours 1',
        weeks: createDefaultWeeks()
      }
    ]
  };
}

module.exports = {
  createDefaultWeeks,
  createInitialAppState,
  generateCourseId
};
