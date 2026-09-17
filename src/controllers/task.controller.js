'use strict';

const taskService = require('../services/task.service');
const { sendSuccess, sendPaginated } = require('../utils/response');

const getAllTasks = async (req, res, next) => {
  try {
    const { tasks, pagination } = await taskService.getAllTasks(req.user.id, req.query);
    sendPaginated(res, tasks, pagination, 'Tasks retrieved');
  } catch (err) {
    next(err);
  }
};

const getTaskById = async (req, res, next) => {
  try {
    const task = await taskService.getTaskById(req.params.id, req.user.id);
    sendSuccess(res, { task }, 'Task retrieved');
  } catch (err) {
    next(err);
  }
};

const createTask = async (req, res, next) => {
  try {
    const task = await taskService.createTask(req.user.id, req.body);
    sendSuccess(res, { task }, 'Task created', 201);
  } catch (err) {
    next(err);
  }
};

const updateTask = async (req, res, next) => {
  try {
    const task = await taskService.updateTask(req.params.id, req.user.id, req.body);
    sendSuccess(res, { task }, 'Task updated');
  } catch (err) {
    next(err);
  }
};

const deleteTask = async (req, res, next) => {
  try {
    await taskService.deleteTask(req.params.id, req.user.id);
    sendSuccess(res, null, 'Task deleted');
  } catch (err) {
    next(err);
  }
};

const getTaskStats = async (req, res, next) => {
  try {
    const stats = await taskService.getTaskStats(req.user.id);
    sendSuccess(res, { stats }, 'Stats retrieved');
  } catch (err) {
    next(err);
  }
};

module.exports = { getAllTasks, getTaskById, createTask, updateTask, deleteTask, getTaskStats };
