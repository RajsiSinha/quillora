const express = require("express");
const router = express.Router();

const {
  createBook,
  getBooks,
  getBookById,
  updateBook,
  deleteBook,
  updateBookCover,
} = require("../controllers/bookController");

const { protect } = require("../middlewares/authMiddleware");
const upload = require("../middlewares/uploadMiddleware");

// Apply protect middleware to all routes in this file
router.use(protect);

router.route("/").post(createBook).get(getBooks);

router
  .route("/:id")
  .get(getBookById)
  .put(updateBook)
  .delete(deleteBook);

router.route("/cover/:id").put(upload, updateBookCover);

module.exports = router;