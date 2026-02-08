const Blog = require("./blog.model");

/**
 * Create blog
 */

exports.createBlog = async (req, res) => {
  const blog = await Blog.create({
    title: req.body.title,
    content: req.body.content,
    author: req.user.id,
    imageUrl: req.file ? `/uploads/${req.file.filename}` : undefined,
  });

  res.status(201).json(blog);
};

/**
 * Get all blogs (authenticated)
 */
exports.getBlogs = async (req, res) => {
  try {
    // Get page and limit from query params, default to page=1, limit=10
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const skip = (page - 1) * limit;

    // Fetch blogs for this user
    const blogs = await Blog.find({ author: req.user.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Total count for client pagination
    const total = await Blog.countDocuments({ author: req.user.id });

    res.json({
      total,
      page,
      pages: Math.ceil(total / limit),
      blogs,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


/**
 * Get single blog
 */
exports.getBlogById = async (req, res) => {
  const blog = await Blog.findOne({
    _id: req.params.id,
    author: req.user.id,
  });

  if (!blog) {
    return res.status(404).json({ message: "Blog not found" });
  }

  res.json(blog);
};

/**
 * Update blog
 */
exports.updateBlog = async (req, res) => {
  const updateData = {
    ...req.body,
  };

  if (req.file) {
    updateData.imageUrl = `/uploads/${req.file.filename}`;
  }

  const blog = await Blog.findOneAndUpdate(
    { _id: req.params.id, author: req.user.id },
    updateData,
    { new: true }
  );

  if (!blog) return res.status(404).json({ message: "Blog not found" });

  res.json(blog);
};


/**
 * Delete blog
 */
exports.deleteBlog = async (req, res) => {
  const blog = await Blog.findOneAndDelete({
    _id: req.params.id,
    author: req.user.id,
  });

  if (!blog) {
    return res.status(404).json({ message: "Blog not found" });
  }

  res.json({ message: "Blog deleted" });
};
