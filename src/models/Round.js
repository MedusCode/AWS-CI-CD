/*****************************************************************************
 * @file Round.js
 * @description Defines the Round model schema using Mongoose.
 ****************************************************************************/
import mongoose from 'mongoose';

const roundSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  },
  course: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum : ['practice','tournament'],
    required: true
  },
  holes: {
    type: Number,
    required: true,
    enum : [9,18]
  },
  strokes: {
    type: Number,
    required: true,
    min: 1,
    max: 300
  },
  seconds: {
    type: Number,
    required: true,
    min: 0,
    max: 21600
  },
  notes: String
});

roundSchema.virtual('SGS').get(function() {
  const totalSeconds = (this.strokes * 60) + this.seconds;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return (minutes + ":" + seconds.toString().padStart(2,'0'));
});

roundSchema.virtual('time').get(function() {
  const minutes = Math.floor(this.seconds / 60);
  const seconds = this.seconds % 60;
  return (minutes + ":" + seconds.toString().padStart(2,'0'));
});

// Virtual property for minutes
roundSchema.virtual('min').get(function() {
  const minutes = Math.floor(this.seconds / 60);
  return minutes;
});

// Virtual property for seconds remaining after minutes are calculated
roundSchema.virtual('sec').get(function() {
  const sec = this.seconds % 60;
  return sec;
});



roundSchema.set('toObject', { virtuals: true });
roundSchema.set('toJSON', { virtuals: true });

//const Round = mongoose.model('Round', roundSchema);
export default roundSchema;