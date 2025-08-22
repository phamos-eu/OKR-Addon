import frappe
from frappe.utils import nowdate, add_days

def run():
    # Create 5 dummy Objectives with measurables
    
    objectives_data = [
        {
            'title': 'Increase Customer Satisfaction',
            'description': 'Improve customer satisfaction scores and service quality by end of year.',
            'target_date': add_days(nowdate(), 90),
            'responsible_person': frappe.session.user,
            'measurables': [
                {
                    'metric_name': 'Customer Satisfaction Score',
                    'baseline_value': 75,
                    'target_value': 90,
                    'percent_complete': 60,
                    'notes': 'Based on quarterly surveys'
                },
                {
                    'metric_name': 'Response Time (hours)',
                    'baseline_value': 24,
                    'target_value': 4,
                    'percent_complete': 70,
                    'notes': 'Average support ticket response time'
                },
                {
                    'metric_name': 'Support Ticket Resolution Rate',
                    'baseline_value': 80,
                    'target_value': 95,
                    'percent_complete': 85,
                    'notes': 'Percentage of tickets resolved within SLA'
                }
            ]
        },
        {
            'title': 'Improve Team Productivity',
            'description': 'Enhance team efficiency and output quality across all departments.',
            'target_date': add_days(nowdate(), 120),
            'responsible_person': frappe.session.user,
            'measurables': [
                {
                    'metric_name': 'Tasks Completed per Week',
                    'baseline_value': 15,
                    'target_value': 25,
                    'percent_complete': 80,
                    'notes': 'Average tasks completed per team member'
                },
                {
                    'metric_name': 'Code Quality Score',
                    'baseline_value': 7,
                    'target_value': 9,
                    'percent_complete': 75,
                    'notes': 'Based on code review metrics (1-10 scale)'
                },
                {
                    'metric_name': 'Meeting Efficiency',
                    'baseline_value': 60,
                    'target_value': 85,
                    'percent_complete': 65,
                    'notes': 'Percentage of meetings that end on time with clear action items'
                }
            ]
        },
        {
            'title': 'Reduce Operational Costs',
            'description': 'Optimize expenses and improve cost efficiency across all operations.',
            'target_date': add_days(nowdate(), 180),
            'responsible_person': frappe.session.user,
            'measurables': [
                {
                    'metric_name': 'Infrastructure Costs ($/month)',
                    'baseline_value': 10000,
                    'target_value': 6000,
                    'percent_complete': 40,
                    'notes': 'Monthly cloud and server costs'
                },
                {
                    'metric_name': 'Energy Consumption (kWh)',
                    'baseline_value': 1000,
                    'target_value': 600,
                    'percent_complete': 55,
                    'notes': 'Monthly office energy usage'
                },
                {
                    'metric_name': 'Vendor Expenses ($/month)',
                    'baseline_value': 5000,
                    'target_value': 3000,
                    'percent_complete': 70,
                    'notes': 'Third-party service costs'
                }
            ]
        },
        {
            'title': 'Enhance Product Quality',
            'description': 'Improve product reliability and user experience through better quality assurance.',
            'target_date': add_days(nowdate(), 150),
            'responsible_person': frappe.session.user,
            'measurables': [
                {
                    'metric_name': 'Bug Reports (per month)',
                    'baseline_value': 50,
                    'target_value': 15,
                    'percent_complete': 60,
                    'notes': 'Critical and major bugs reported by users'
                },
                {
                    'metric_name': 'User Adoption Rate (%)',
                    'baseline_value': 60,
                    'target_value': 85,
                    'percent_complete': 75,
                    'notes': 'Percentage of target users actively using the product'
                },
                {
                    'metric_name': 'Feature Completion Rate (%)',
                    'baseline_value': 70,
                    'target_value': 95,
                    'percent_complete': 80,
                    'notes': 'Features delivered on time and within scope'
                }
            ]
        },
        {
            'title': 'Expand Market Reach',
            'description': 'Increase market presence and customer base across new territories.',
            'target_date': add_days(nowdate(), 200),
            'responsible_person': frappe.session.user,
            'measurables': [
                {
                    'metric_name': 'New Customer Acquisition (per month)',
                    'baseline_value': 10,
                    'target_value': 25,
                    'percent_complete': 45,
                    'notes': 'New paying customers acquired monthly'
                },
                {
                    'metric_name': 'Market Share (%)',
                    'baseline_value': 5,
                    'target_value': 12,
                    'percent_complete': 35,
                    'notes': 'Percentage of total addressable market captured'
                },
                {
                    'metric_name': 'Geographic Coverage (regions)',
                    'baseline_value': 3,
                    'target_value': 8,
                    'percent_complete': 50,
                    'notes': 'Number of regions with active operations'
                }
            ]
        }
    ]
    
    created_objectives = []
    
    for obj_data in objectives_data:
        # Create Objective
        obj = frappe.get_doc({
            'doctype': 'Objective',
            'title': obj_data['title'],
            'description': obj_data['description'],
            'target_date': obj_data['target_date'],
            'responsible_person': obj_data['responsible_person'],
            'progress': 0  # Will be calculated in before_save
        })
        obj.insert(ignore_permissions=True)
        created_objectives.append(obj)
        
        # Add measurables to the objective
        for measurable_data in obj_data['measurables']:
            obj.append('measurables', measurable_data)
        
        # Save will trigger before_save which calculates progress
        obj.save(ignore_permissions=True)
        frappe.db.commit()
    
    # Update progress for all existing objectives
    update_all_objective_progress()
    
    print(f'Created {len(created_objectives)} dummy objectives with measurables.')
    print('Objectives created:')
    for obj in created_objectives:
        print(f'- {obj.title} (ID: {obj.name}, Progress: {obj.progress}%)')

def update_all_objective_progress():
    """Update progress for all existing objectives"""
    objectives = frappe.get_all("Objective", fields=["name"])
    updated_count = 0
    
    for obj in objectives:
        try:
            doc = frappe.get_doc("Objective", obj.name)
            old_progress = doc.progress
            doc.progress = doc.calculate_progress()
            
            if old_progress != doc.progress:
                doc.save(ignore_permissions=True)
                updated_count += 1
                print(f"Updated progress for {doc.title}: {old_progress}% -> {doc.progress}%")
        except Exception as e:
            print(f"Error updating progress for {obj.name}: {str(e)}")
    
    frappe.db.commit()
    print(f"Updated progress for {updated_count} objectives.") 