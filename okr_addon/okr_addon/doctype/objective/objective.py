# Copyright (c) 2025, Phamos and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document

class Objective(Document):
    def validate(self):
        self.validate_measurables()
    
    def before_save(self):
        self.update_measurable_targets()
        # Calculate and update progress based on measurables
        self.progress = self.calculate_progress()
    
    def after_save(self):
        self.update_parent_objective_progress()
    
    def calculate_progress(self):
        """Calculate overall progress from measurables"""
        if not self.measurables:
            return 0
        
        total_percent = 0
        valid_measurables = 0
        
        for measurable in self.measurables:
            if measurable.percent_complete is not None:
                total_percent += measurable.percent_complete
                valid_measurables += 1
        
        if valid_measurables == 0:
            return 0
        
        return total_percent / valid_measurables
    
    def validate_measurables(self):
        """Validate measurable data"""
        for measurable in self.measurables:
            if measurable.baseline_value == measurable.target_value:
                frappe.throw(f"Baseline value cannot be equal to target value for measurable: {measurable.title}")
    
    def update_measurable_targets(self):
        """Update measurable percent complete if not set"""
        for measurable in self.measurables:
            if measurable.percent_complete is None:
                if measurable.metric_type == "Increasing":
                    if measurable.target_value <= measurable.baseline_value:
                        measurable.percent_complete = 0
                else:  # Decreasing
                    if measurable.target_value >= measurable.baseline_value:
                        measurable.percent_complete = 0
    
    def update_parent_objective_progress(self):
        """Update parent objective progress if this is a child objective"""
        if self.parent_objective:
            parent = frappe.get_doc("Objective", self.parent_objective)
            parent.progress = parent.calculate_progress()
            parent.save()
    
    def get_measurable_summary(self):
        """Get summary of measurables"""
        if not self.measurables:
            return {
                "total": 0,
                "completed": 0,
                "in_progress": 0,
                "not_started": 0,
                "average_progress": 0
            }
        
        total = len(self.measurables)
        completed = 0
        in_progress = 0
        not_started = 0
        total_progress = 0
        
        for measurable in self.measurables:
            if measurable.percent_complete is None:
                not_started += 1
            elif measurable.percent_complete >= 100:
                completed += 1
            elif measurable.percent_complete > 0:
                in_progress += 1
            else:
                not_started += 1
            
            if measurable.percent_complete is not None:
                total_progress += measurable.percent_complete
        
        return {
            "total": total,
            "completed": completed,
            "in_progress": in_progress,
            "not_started": not_started,
            "average_progress": total_progress / total if total > 0 else 0
        }
