'use strict';

const express = require('express');
const router = express.Router();

const canvasStore = require('../services/canvas-store');

router.get('/state', async (req, res, next) => {
  try {
    const state = await canvasStore.getState();
    res.json({ state });
  } catch (error) {
    next(error);
  }
});

router.put('/state', async (req, res, next) => {
  try {
    const payload = req.body && (req.body.state || req.body.data || req.body);
    if (!payload || typeof payload !== 'object') {
      res.status(400).json({ error: 'Invalid state payload.' });
      return;
    }
    await canvasStore.replaceState(payload);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

router.get('/courses', async (req, res, next) => {
  try {
    const state = await canvasStore.getState();
    res.json({ courses: state.courses, activeCourseId: state.activeCourseId });
  } catch (error) {
    next(error);
  }
});

router.post('/courses', async (req, res, next) => {
  try {
    const course = await canvasStore.createCourse(req.body || {});
    res.status(201).json({ course });
  } catch (error) {
    next(error);
  }
});

router.get('/courses/:courseId', async (req, res, next) => {
  try {
    const course = await canvasStore.getCourse(req.params.courseId);
    if (!course) {
      res.status(404).json({ error: 'Course not found.' });
      return;
    }
    res.json({ course });
  } catch (error) {
    next(error);
  }
});

router.patch('/courses/:courseId', async (req, res, next) => {
  try {
    const course = await canvasStore.updateCourse(req.params.courseId, req.body || {});
    if (!course) {
      res.status(404).json({ error: 'Course not found.' });
      return;
    }
    res.json({ course });
  } catch (error) {
    next(error);
  }
});

router.delete('/courses/:courseId', async (req, res, next) => {
  try {
    const deleted = await canvasStore.deleteCourse(req.params.courseId);
    if (!deleted) {
      res.status(404).json({ error: 'Course not found.' });
      return;
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

router.post('/courses/:courseId/activate', async (req, res, next) => {
  try {
    const courseId = await canvasStore.setActiveCourse(req.params.courseId);
    if (!courseId) {
      res.status(404).json({ error: 'Course not found.' });
      return;
    }
    res.json({ activeCourseId: courseId });
  } catch (error) {
    next(error);
  }
});

router.get('/courses/:courseId/weeks', async (req, res, next) => {
  try {
    const course = await canvasStore.getCourse(req.params.courseId);
    if (!course) {
      res.status(404).json({ error: 'Course not found.' });
      return;
    }
    res.json({ weeks: course.weeks });
  } catch (error) {
    next(error);
  }
});

router.post('/courses/:courseId/weeks', async (req, res, next) => {
  try {
    const week = await canvasStore.addWeek(req.params.courseId, req.body || {});
    if (!week) {
      res.status(404).json({ error: 'Course not found.' });
      return;
    }
    res.status(201).json({ week });
  } catch (error) {
    next(error);
  }
});

router.get('/courses/:courseId/weeks/:weekId', async (req, res, next) => {
  try {
    const course = await canvasStore.getCourse(req.params.courseId);
    if (!course) {
      res.status(404).json({ error: 'Course not found.' });
      return;
    }
    const week = course.weeks.find((item) => item.id === req.params.weekId);
    if (!week) {
      res.status(404).json({ error: 'Week not found.' });
      return;
    }
    res.json({ week });
  } catch (error) {
    next(error);
  }
});

router.patch('/courses/:courseId/weeks/:weekId', async (req, res, next) => {
  try {
    const week = await canvasStore.updateWeek(req.params.courseId, req.params.weekId, req.body || {});
    if (!week) {
      res.status(404).json({ error: 'Week not found.' });
      return;
    }
    res.json({ week });
  } catch (error) {
    next(error);
  }
});

router.delete('/courses/:courseId/weeks/:weekId', async (req, res, next) => {
  try {
    const deleted = await canvasStore.deleteWeek(req.params.courseId, req.params.weekId);
    if (!deleted) {
      res.status(404).json({ error: 'Week not found.' });
      return;
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

router.get('/courses/:courseId/weeks/:weekId/activities', async (req, res, next) => {
  try {
    const course = await canvasStore.getCourse(req.params.courseId);
    if (!course) {
      res.status(404).json({ error: 'Course not found.' });
      return;
    }
    const week = course.weeks.find((item) => item.id === req.params.weekId);
    if (!week) {
      res.status(404).json({ error: 'Week not found.' });
      return;
    }
    res.json({ activities: week.activities });
  } catch (error) {
    next(error);
  }
});

router.post('/courses/:courseId/weeks/:weekId/activities', async (req, res, next) => {
  try {
    const activity = await canvasStore.addActivity(req.params.courseId, req.params.weekId, req.body || {});
    if (!activity) {
      res.status(404).json({ error: 'Week not found.' });
      return;
    }
    res.status(201).json({ activity });
  } catch (error) {
    next(error);
  }
});

router.patch(
  '/courses/:courseId/weeks/:weekId/activities/:activityId',
  async (req, res, next) => {
    try {
      const activity = await canvasStore.updateActivity(
        req.params.courseId,
        req.params.weekId,
        req.params.activityId,
        req.body || {}
      );
      if (!activity) {
        res.status(404).json({ error: 'Activity not found.' });
        return;
      }
      res.json({ activity });
    } catch (error) {
      next(error);
    }
  }
);

router.delete(
  '/courses/:courseId/weeks/:weekId/activities/:activityId',
  async (req, res, next) => {
    try {
      const deleted = await canvasStore.deleteActivity(
        req.params.courseId,
        req.params.weekId,
        req.params.activityId
      );
      if (!deleted) {
        res.status(404).json({ error: 'Activity not found.' });
        return;
      }
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
