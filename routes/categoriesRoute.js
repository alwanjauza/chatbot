const express = require("express");
const router = express.Router();
const moment = require("moment"); // Import Moment.js library
const Category = require("../model/category");
const Reply = require("../model/reply");

// Create a new category
router.post("/", async (req, res) => {
  try {
    const category = new Category({
      name: req.body.name,
    });
    await category.save();
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all categories
router.get("/", async (req, res) => {
  try {
    const categories = await Category.find();
    const formattedCategories = categories.map(category => ({
      ...category.toObject(),
      createdAt: moment(category.createdAt).format("YYYY-MM-DD | HH:mm:ss"),
      updatedAt: moment(category.updatedAt).format("YYYY-MM-DD | HH:mm:ss")
    }));
    res.status(200).json(formattedCategories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get a category by ID
router.get("/:id", async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category)
      return res.status(404).json({ message: "Category not found" });
    const formattedCategory = {
      ...category.toObject(),
      createdAt: moment(category.createdAt).format("YYYY-MM-DD | HH:mm:ss"),
      updatedAt: moment(category.updatedAt).format("YYYY-MM-DD | HH:mm:ss")
    };
    res.status(200).json(formattedCategory);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update a category by ID
router.put("/:id", async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { name: req.body.name },
      { new: true }
    );
    if (!category)
      return res.status(404).json({ message: "Category not found" });
    res.status(200).json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Patch a category by ID (update specific fields)
router.patch("/:id", async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    if (!category)
      return res.status(404).json({ message: "Category not found" });
    res.status(200).json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete a category by ID
router.delete("/:id", async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category)
      return res.status(404).json({ message: "Category not found" });

    // Delete replies with the same categoryId
    await Reply.deleteMany({ categoryId: req.params.id });

    res.status(200).json({ message: "Category and associated replies deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
