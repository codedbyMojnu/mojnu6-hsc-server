const Level = require('../models/Level');

exports.getLevels = async (req, res) => {
    const levels = await Level.find();
    res.json(levels);
};

exports.addLevel = async (req, res) => {
    const level = new Level(req.body);
    await level.save();
    res.status(201).json(level);
};

exports.updateLevel = async (req, res) => {
    const level = await Level.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(level);
};

exports.deleteLevel = async (req, res) => {
    await Level.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted successfully' });
};