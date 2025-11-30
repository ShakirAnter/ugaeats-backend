import mongoose from "mongoose";

export interface ISettings extends mongoose.Document {
  key: string; // e.g. 'global'
  ui: {
    theme: "light" | "dark" | "system";
    mapTile: "streets" | "satellite";
    showLabels: boolean;
  };
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
    events: {
      order_new: boolean;
      order_update: boolean;
    };
  };
  system: {
    maintenanceMode: boolean;
    maintenanceMessage?: string;
  };
  delivery: {
    autoAssignRadiusKm: number;
  };
  created_at: Date;
  updated_at: Date;
}

const settingsSchema = new mongoose.Schema({
  key: { type: String, default: "global", unique: true },
  ui: {
    theme: { type: String, enum: ["light", "dark", "system"], default: "system" },
    mapTile: { type: String, enum: ["streets", "satellite"], default: "streets" },
    showLabels: { type: Boolean, default: true },
  },
  notifications: {
    email: { type: Boolean, default: true },
    sms: { type: Boolean, default: false },
    push: { type: Boolean, default: true },
    events: {
      order_new: { type: Boolean, default: true },
      order_update: { type: Boolean, default: true },
    }
  },
  system: {
    maintenanceMode: { type: Boolean, default: false },
    maintenanceMessage: { type: String, default: "" },
  },
  delivery: {
    autoAssignRadiusKm: { type: Number, default: 7 },
  },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

settingsSchema.pre<ISettings>("save", function(next) {
  this.updated_at = new Date();
  next();
});

export const Settings = mongoose.model<ISettings>("Settings", settingsSchema);
