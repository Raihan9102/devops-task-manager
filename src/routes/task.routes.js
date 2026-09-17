'use strict';

const express = require('express');
const router = express.Router();
const taskController = require('../controllers/task.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { validate, taskSchema, taskUpdateSchema } = require('../validators');

// All task routes require authentication
router.use(authenticate);

router.get('/stats', taskController.getTaskStats);
router.get('/', taskController.getAllTasks);
router.get('/:id', taskController.getTaskById);
router.post('/', validate(taskSchema), taskController.createTask);
router.put('/:id', validate(taskUpdateSchema), taskController.updateTask);
router.delete('/:id', taskController.deleteTask);

module.exports = router;
