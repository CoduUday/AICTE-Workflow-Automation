import mongoose from 'mongoose';

const institutionSchema = new mongoose.Schema(
  {
    institutionId: {
      type: String,
      required: [true, 'Institution ID is required'],
      unique: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Institution name is required'],
      trim: true,
    },
    region: {
      type: String,
      required: [true, 'Region is required'],
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    state: {
      type: String,
      trim: true,
    },
    principalName: {
      type: String,
      trim: true,
    },
    contactEmail: {
      type: String,
      trim: true,
    },
    contactPhone: {
      type: String,
      trim: true,
    },
    establishedYear: {
      type: Number,
    },
    accreditationStatus: {
      type: String,
      default: 'Eligible',
    },
  },
  {
    timestamps: true,
  }
);

export const Institution = mongoose.model('Institution', institutionSchema);
export default Institution;
