import Submission from '../models/Submission.js';
export const getRecentSubmissions = async (req, res) => {
  const { id: problemId } = req.params;
  const userId = req.user.id;
  const limit = parseInt(req.query.limit) || 100;

  const submissions = await Submission.find({
    user: userId,
    problem: problemId
  })
    .sort({ submittedAt: -1 })
    .limit(limit);

  res.json({ success: true, data: submissions });
}; 