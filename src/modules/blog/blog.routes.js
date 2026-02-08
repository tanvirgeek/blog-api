const express = require("express");
const router = express.Router();
const controller = require("./blog.controller");
const { requireAuth } = require("../../middlewares/auth.middleware");
const upload = require("../../middlewares/upload.middleware");

router.use(requireAuth);

// Create blog with image
router.post("/", upload.single("image"), controller.createBlog);

// Update blog with image
router.put("/:id", upload.single("image"), controller.updateBlog);

router.get("/", controller.getBlogs);
router.get("/:id", controller.getBlogById);
router.delete("/:id", controller.deleteBlog);

module.exports = router;
