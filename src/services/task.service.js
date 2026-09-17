'use strict';

const { Op } = require('sequelize');
const Task = require('../models/Task');
const AppError = require('../utils/AppError');
const { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } = require('../config/app');

/**
 * Get all tasks for a user with filtering, sorting, and pagination
 */
const getAllTasks = async (userId, query = {}) => {
  const {
    status,
    priority,
    search,
    page = 1,
    limit = DEFAULT_PAGE_SIZE,
    sortBy = 'createdAt',
    sortOrder = 'DESC',
  } = query;

  const pageSize = Math.min(parseInt(limit), MAX_PAGE_SIZE);
  const offset = (parseInt(page) - 1) * pageSize;

  const where = { userId };
  if (status) where.status = status;
  if (priority) where.priority = priority;
  if (search) {
    where[Op.or] = [
      { title: { [Op.iLike]: `%${search}%` } },
      { description: { [Op.iLike]: `%${search}%` } },
    ];
  }

  const { count, rows } = await Task.findAndCountAll({
    where,
    limit: pageSize,
    offset,
    order: [[sortBy, sortOrder.toUpperCase()]],
  });

  return {
    tasks: rows,
    pagination: {
      total: count,
      page: parseInt(page),
      pageSize,
      totalPages: Math.ceil(count / pageSize),
    },
  };
};

/**
 * Get single task by ID (owner check)
 */
const getTaskById = async (taskId, userId) => {
  const task = await Task.findOne({ where: { id: taskId, userId } });
  if (!task) throw new AppError('Task not found', 404);
  return task;
};

/**
 * Create a new task
 */
const createTask = async (userId, data) => {
  return await Task.create({ ...data, userId });
};

/**
 * Update an existing task
 */
const updateTask = async (taskId, userId, data) => {
  const task = await getTaskById(taskId, userId);
  await task.update(data);
  return task;
};

/**
 * Delete a task (soft delete)
 */
const deleteTask = async (taskId, userId) => {
  const task = await getTaskById(taskId, userId);
  await task.destroy();
  return { message: 'Task deleted successfully' };
};

/**
 * Get task statistics for a user
 */
const getTaskStats = async (userId) => {
  const tasks = await Task.findAll({ where: { userId } });
  const stats = {
    total: tasks.length,
    byStatus: { todo: 0, in_progress: 0, done: 0, cancelled: 0 },
    byPriority: { low: 0, medium: 0, high: 0, critical: 0 },
    completionRate: 0,
  };

  tasks.forEach((t) => {
    stats.byStatus[t.status]++;
    stats.byPriority[t.priority]++;
  });

  if (stats.total > 0) {
    stats.completionRate = Math.round((stats.byStatus.done / stats.total) * 100);
  }

  return stats;
};

module.exports = { getAllTasks, getTaskById, createTask, updateTask, deleteTask, getTaskStats };
