import mongoose from "mongoose";

const studentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      trim: true
    },
    rollNumber: {
      type: String,
      required: true,
      trim: true
    },
    course: {
      type: String,
      required: true
    },
    attendance: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    marks: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  },
  { timestamps: true }
);

export default mongoose.model("Student", studentSchema);