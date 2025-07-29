import frappe
from frappe.model.document import Document

class Measurable(Document):
    def validate(self):
        self.validate_values()
        self.auto_calculate_percent_complete()
    
    def validate_values(self):
        """Validate baseline and target values"""
        if self.baseline_value == self.target_value:
            frappe.throw("Baseline value cannot be equal to target value")
        
        if self.percent_complete and (self.percent_complete < 0 or self.percent_complete > 100):
            frappe.throw("Percent complete must be between 0 and 100")
    
    def auto_calculate_percent_complete(self):
        """Auto-calculate percent complete if current value is set"""
        if self.current_value is not None and self.baseline_value and self.target_value:
            self.update_percent_complete_from_current_value()
    
    def update_percent_complete_from_current_value(self):
        """Update percent complete based on current value"""
        if self.metric_type == "Increasing":
            if self.current_value <= self.baseline_value:
                self.percent_complete = 0
            elif self.current_value >= self.target_value:
                self.percent_complete = 100
            else:
                progress = (self.current_value - self.baseline_value) / (self.target_value - self.baseline_value)
                self.percent_complete = min(100, max(0, progress * 100))
        else:  # Decreasing
            if self.current_value >= self.baseline_value:
                self.percent_complete = 0
            elif self.current_value <= self.target_value:
                self.percent_complete = 100
            else:
                progress = (self.baseline_value - self.current_value) / (self.baseline_value - self.target_value)
                self.percent_complete = min(100, max(0, progress * 100))
    
    def get_progress_status(self):
        """Get human-readable progress status"""
        if not self.percent_complete:
            return "Not Started"
        elif self.percent_complete < 25:
            return "Early Stage"
        elif self.percent_complete < 50:
            return "In Progress"
        elif self.percent_complete < 75:
            return "Good Progress"
        elif self.percent_complete < 100:
            return "Near Completion"
        else:
            return "Completed"
    
    def get_remaining_work(self):
        """Calculate remaining work based on current progress"""
        if not self.percent_complete:
            return "Unknown"
        
        remaining_percent = 100 - self.percent_complete
        if remaining_percent <= 0:
            return "Completed"
        elif remaining_percent <= 10:
            return "Almost Done"
        elif remaining_percent <= 25:
            return "Nearly Complete"
        elif remaining_percent <= 50:
            return "Halfway There"
        else:
            return "Significant Work Remaining" 