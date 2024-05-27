const express = require("express");
const router = express.Router();
const moment = require("moment"); // Import Moment.js library
const Reply = require("../model/reply");
const Category = require("../model/category");

// Create a new reply
router.post("/", async (req, res) => {
  try {
    const reply = new Reply({
      categoryId: req.body.categoryId,
      message: req.body.message,
      reply: req.body.reply,
    });
    await reply.save();
    res.status(201).json(reply);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all replies
router.get("/", async (req, res) => {
  try {
    const replies = await Reply.find().populate("categoryId");
    const response = replies.map((reply) => ({
      _id: reply._id,
      categoryName: reply.categoryId.name, // assuming 'name' is the field in Category model
      message: reply.message,
      reply: reply.reply,
      createdAt: moment(reply.createdAt).format("YYYY-MM-DD | HH:mm:ss"), // Format createdAt timestamp
      updatedAt: moment(reply.updatedAt).format("YYYY-MM-DD | HH:mm:ss"), // Format updatedAt timestamp
    }));
    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get replies by category ID
router.get("/:categoryId", async (req, res) => {
  try {
    const replies = await Reply.find({
      categoryId: req.params.categoryId,
    }).populate("categoryId");
    if (replies.length === 0)
      return res
        .status(404)
        .json({ message: "No replies found for this category" });
    const response = replies.map((reply) => ({
      _id: reply._id,
      categoryName: reply.categoryId.name, // assuming 'name' is the field in Category model
      message: reply.message,
      reply: reply.reply,
      createdAt: moment(reply.createdAt).format("YYYY-MM-DD | HH:mm:ss"), // Format createdAt timestamp
      updatedAt: moment(reply.updatedAt).format("YYYY-MM-DD | HH:mm:ss"), // Format updatedAt timestamp
    }));
    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get a reply by ID
router.get("/reply/:id", async (req, res) => {
  try {
    const reply = await Reply.findById(req.params.id).populate("categoryId");
    if (!reply) return res.status(404).json({ message: "Reply not found" });
    res.status(200).json({
      _id: reply._id,
      categoryName: reply.categoryId.name, // assuming 'name' is the field in Category model
      message: reply.message,
      reply: reply.reply,
      createdAt: moment(reply.createdAt).format("YYYY-MM-DD | HH:mm:ss"), // Format createdAt timestamp
      updatedAt: moment(reply.updatedAt).format("YYYY-MM-DD | HH:mm:ss"), // Format updatedAt timestamp
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update a reply by ID
router.put("/:id", async (req, res) => {
  try {
    const reply = await Reply.findByIdAndUpdate(
      req.params.id,
      {
        categoryId: req.body.categoryId,
        message: req.body.message,
        reply: req.body.reply,
      },
      { new: true }
    ).populate("categoryId");
    if (!reply) return res.status(404).json({ message: "Reply not found" });
    res.status(200).json({
      _id: reply._id,
      categoryName: reply.categoryId.name, // assuming 'name' is the field in Category model
      message: reply.message,
      reply: reply.reply,
      createdAt: moment(reply.createdAt).format("YYYY-MM-DD | HH:mm:ss"), // Format createdAt timestamp
      updatedAt: moment(reply.updatedAt).format("YYYY-MM-DD | HH:mm:ss"), // Format updatedAt timestamp
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Patch a reply by ID (update specific fields)
router.patch("/:id", async (req, res) => {
  try {
    const reply = await Reply.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    ).populate("categoryId");
    if (!reply) return res.status(404).json({ message: "Reply not found" });
    res.status(200).json({
      _id: reply._id,
      categoryName: reply.categoryId.name, // assuming 'name' is the field in Category model
      message: reply.message,
      reply: reply.reply,
      createdAt: moment(reply.createdAt).format("YYYY-MM-DD | HH:mm:ss"), // Format createdAt timestamp
      updatedAt: moment(reply.updatedAt).format("YYYY-MM-DD | HH:mm:ss"), // Format updatedAt timestamp
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete a reply by ID
router.delete("/:id", async (req, res) => {
  try {
    const reply = await Reply.findByIdAndDelete(req.params.id);
    if (!reply) return res.status(404).json({ message: "Reply not found" });
    res.status(200).json({ message: "Reply deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
