import frappe
from frappe import _
from datetime import datetime, timedelta
import json
from frappe.utils import getdate, nowdate, add_days

def get_context(context):
    context.no_cache = 1
    context.title = _("OKR Dashboard")

@frappe.whitelist()
def get_dashboard_data(filters = None):
    """Get comprehensive dashboard data with advanced filtering"""
    try:
        # Parse filters
        if filters:
            filters = json.loads(filters)
        else:
            filters = {}
        
        # Get objectives with enhanced filtering
        objectives = get_filtered_objectives(filters)
        
        # Calculate comprehensive statistics
        stats = calculate_comprehensive_stats(objectives)
        
        # Get hierarchical data (parent-child relationships)
        hierarchy_data = get_hierarchy_data(objectives)
        
        # Get performance metrics
        performance_metrics = get_performance_metrics(objectives)
        
        # Get timeline data
        timeline_data = get_timeline_data(filters)
        
        # Get risk analysis
        risk_analysis = get_risk_analysis(objectives)
        
        # Get team/individual performance
        team_performance = get_team_performance(objectives)
        
        return {
            "objectives": objectives,
            "stats": stats,
            "hierarchy_data": hierarchy_data,
            "performance_metrics": performance_metrics,
            "timeline_data": timeline_data,
            "risk_analysis": risk_analysis,
            "team_performance": team_performance,
            "filters": filters
        }
    except Exception as e:
        frappe.log_error(f"Error in get_dashboard_data: {str(e)}")
        return {"error": str(e)}

def get_filtered_objectives(filters):
    """Get objectives with advanced filtering"""
    filter_conditions = {}
    
    # Date filtering
    if filters.get('date_range'):
        if filters['date_range'] == 'this_month':
            start_date = getdate().replace(day=1)
            end_date = (start_date + timedelta(days=32)).replace(day=1) - timedelta(days=1)
            filter_conditions['creation'] = ['between', [start_date, end_date]]
        elif filters['date_range'] == 'this_quarter':
            current_month = getdate().month
            quarter_start_month = ((current_month - 1) // 3) * 3 + 1
            start_date = getdate().replace(month=quarter_start_month, day=1)
            end_date = (start_date + timedelta(days=92)).replace(day=1) - timedelta(days=1)
            filter_conditions['creation'] = ['between', [start_date, end_date]]
        elif filters['date_range'] == 'custom' and filters.get('from_date') and filters.get('to_date'):
            filter_conditions['creation'] = ['between', [filters['from_date'], filters['to_date']]]
    
    # Status filtering
    if filters.get('status'):
        if filters['status'] == 'completed':
            filter_conditions['progress'] = 100
        elif filters['status'] == 'in_progress':
            filter_conditions['progress'] = ['>', 0]
        elif filters['status'] == 'not_started':
            filter_conditions['progress'] = 0
        elif filters['status'] == 'at_risk':
            # This will be handled in post-processing
            pass
    
    # OKR Type filtering
    if filters.get('okr_type'):
        filter_conditions['okr_type'] = filters['okr_type']
    
    # Responsible person filtering
    if filters.get('responsible_person'):
        filter_conditions['responsible_person'] = filters['responsible_person']
    
    # Get objectives
    objectives = frappe.get_all(
        "Objective",
        filters=filter_conditions,
        fields=[
            "name", "title", "progress", "responsible_person", "target_date", 
            "creation", "modified", "okr_type", "parent_company_okr", 
            "confidence_level", "okr_score", "check_in_frequency", "last_check_in", 
            "next_check_in"
        ],
        order_by="creation desc"
    )
    
    # Post-process for complex filters
    if filters.get('status') == 'at_risk':
        objectives = [obj for obj in objectives if is_at_risk(obj)]
    
    # Add computed fields
    for objective in objectives:
        objective['measurables_summary'] = get_measurables_summary(objective.name)
        objective['health_score'] = calculate_health_score(objective)
        objective['days_remaining'] = calculate_days_remaining(objective)
        objective['status_category'] = get_status_category(objective)
        objective['child_objectives'] = get_child_objectives(objective.name)
    
    return objectives

def calculate_comprehensive_stats(objectives):
    """Calculate comprehensive dashboard statistics"""
    total = len(objectives)
    if total == 0:
        return get_empty_stats()
    
    # Basic counts
    completed = sum(1 for obj in objectives if obj.progress == 100)
    in_progress = sum(1 for obj in objectives if 0 < obj.progress < 100)
    not_started = sum(1 for obj in objectives if obj.progress == 0)
    at_risk = sum(1 for obj in objectives if obj['status_category'] == 'at_risk')
    on_track = sum(1 for obj in objectives if obj['status_category'] == 'on_track')
    ahead_schedule = sum(1 for obj in objectives if obj['status_category'] == 'ahead_schedule')
    
    # Progress calculations
    overall_progress = sum(obj.progress or 0 for obj in objectives) / total
    avg_confidence = sum(obj.confidence_level or 0 for obj in objectives) / total
    avg_okr_score = sum(obj.okr_score or 0 for obj in objectives) / total
    
    # Type distribution
    company_okrs = sum(1 for obj in objectives if obj.okr_type == 'Company')
    team_okrs = sum(1 for obj in objectives if obj.okr_type == 'Team')
    individual_okrs = sum(1 for obj in objectives if obj.okr_type == 'Individual')
    
    # Timeline analysis
    overdue = sum(1 for obj in objectives if obj['days_remaining'] < 0)
    due_soon = sum(1 for obj in objectives if 0 <= obj['days_remaining'] <= 7)
    
    return {
        "total": total,
        "completed": completed,
        "in_progress": in_progress,
        "not_started": not_started,
        "at_risk": at_risk,
        "on_track": on_track,
        "ahead_schedule": ahead_schedule,
        "overall_progress": round(overall_progress, 1),
        "avg_confidence": round(avg_confidence, 1),
        "avg_okr_score": round(avg_okr_score, 2),
        "completion_rate": round((completed / total) * 100, 1),
        "risk_rate": round((at_risk / total) * 100, 1),
        "type_distribution": {
            "company": company_okrs,
            "team": team_okrs,
            "individual": individual_okrs
        },
        "timeline": {
            "overdue": overdue,
            "due_soon": due_soon,
            "on_time": total - overdue - due_soon
        }
    }

def get_hierarchy_data(objectives):
    """Get parent-child relationship data"""
    hierarchy = {
        "company_okrs": [],
        "team_okrs": [],
        "individual_okrs": [],
        "orphaned_okrs": []
    }
    
    for objective in objectives:
        if objective.okr_type == 'Company':
            objective['children'] = get_child_objectives(objective.name)
            hierarchy['company_okrs'].append(objective)
        elif objective.okr_type == 'Team':
            if objective.parent_company_okr:
                hierarchy['team_okrs'].append(objective)
            else:
                hierarchy['orphaned_okrs'].append(objective)
        elif objective.okr_type == 'Individual':
            if objective.parent_company_okr:
                hierarchy['individual_okrs'].append(objective)
            else:
                hierarchy['orphaned_okrs'].append(objective)
    
    return hierarchy

def get_performance_metrics(objectives):
    """Get detailed performance metrics"""
    if not objectives:
        return {}
    
    # Progress distribution
    progress_dist = {"excellent": 0, "good": 0, "fair": 0, "poor": 0, "critical": 0}
    confidence_dist = {"high": 0, "medium": 0, "low": 0}
    
    for obj in objectives:
        # Progress distribution
        if obj.progress >= 90:
            progress_dist["excellent"] += 1
        elif obj.progress >= 70:
            progress_dist["good"] += 1
        elif obj.progress >= 50:
            progress_dist["fair"] += 1
        elif obj.progress >= 30:
            progress_dist["poor"] += 1
        else:
            progress_dist["critical"] += 1
        
        # Confidence distribution
        if obj.confidence_level >= 80:
            confidence_dist["high"] += 1
        elif obj.confidence_level >= 60:
            confidence_dist["medium"] += 1
        else:
            confidence_dist["low"] += 1
    
    total = len(objectives)
    
    return {
        "progress_distribution": {k: round((v/total)*100, 1) for k, v in progress_dist.items()},
        "confidence_distribution": {k: round((v/total)*100, 1) for k, v in confidence_dist.items()},
        "avg_health_score": round(sum(obj['health_score'] for obj in objectives) / total, 1)
    }

def get_timeline_data(filters):
    """Get timeline data for charts"""
    months = []
    progress_data = []
    confidence_data = []
    
    # Build filter conditions based on applied filters
    filter_conditions = {}
    
    # Date filtering
    if filters.get('date_range'):
        if filters['date_range'] == 'this_month':
            start_date = getdate().replace(day=1)
            end_date = (start_date + timedelta(days=32)).replace(day=1) - timedelta(days=1)
            filter_conditions['creation'] = ['between', [start_date, end_date]]
        elif filters['date_range'] == 'this_quarter':
            current_month = getdate().month
            quarter_start_month = ((current_month - 1) // 3) * 3 + 1
            start_date = getdate().replace(month=quarter_start_month, day=1)
            end_date = (start_date + timedelta(days=92)).replace(day=1) - timedelta(days=1)
            filter_conditions['creation'] = ['between', [start_date, end_date]]
        elif filters['date_range'] == 'custom' and filters.get('from_date') and filters.get('to_date'):
            filter_conditions['creation'] = ['between', [filters['from_date'], filters['to_date']]]
    
    # OKR Type filtering
    if filters.get('okr_type') and filters['okr_type'] != 'all':
        filter_conditions['okr_type'] = filters['okr_type']
    
    # Responsible person filtering
    if filters.get('responsible_person') and filters['responsible_person'] != 'all':
        filter_conditions['responsible_person'] = filters['responsible_person']
    
    for i in range(11, -1, -1):
        date = datetime.now() - timedelta(days=30*i)
        month_name = date.strftime("%b")
        months.append(month_name)
        
        # Calculate metrics for this month with filters
        start_date = date.replace(day=1)
        end_date = (start_date + timedelta(days=32)).replace(day=1) - timedelta(days=1)
        
        # Add month filter to existing filters
        month_filters = filter_conditions.copy()
        month_filters['creation'] = ['between', [start_date, end_date]]
        
        month_objectives = frappe.get_all(
            "Objective",
            filters=month_filters,
            fields=["progress", "confidence_level"]
        )
        
        avg_progress = 0
        avg_confidence = 0
        if month_objectives:
            avg_progress = sum(obj.progress or 0 for obj in month_objectives) / len(month_objectives)
            avg_confidence = sum(obj.confidence_level or 0 for obj in month_objectives) / len(month_objectives)
        
        progress_data.append(round(avg_progress, 1))
        confidence_data.append(round(avg_confidence, 1))

    return {
        "labels": months,
        "progress": progress_data,
        "confidence": confidence_data
    }

def get_risk_analysis(objectives):
    """Get risk analysis data"""
    if not objectives:
        return {}
    
    risk_factors = {
        "overdue": 0,
        "low_confidence": 0,
        "low_progress": 0,
        "no_measurables": 0,
        "no_check_ins": 0
    }
    
    for obj in objectives:
        # Overdue
        if obj['days_remaining'] < 0:
            risk_factors["overdue"] += 1
        
        # Low confidence
        if obj.confidence_level and obj.confidence_level < 50:
            risk_factors["low_confidence"] += 1
        
        # Low progress
        if obj.progress and obj.progress < 30:
            risk_factors["low_progress"] += 1
        
        # No measurables
        if obj['measurables_summary']['total'] == 0:
            risk_factors["no_measurables"] += 1
        
        # No recent check-ins
        if obj.last_check_in:
            days_since_checkin = (getdate() - getdate(obj.last_check_in)).days
            if days_since_checkin > 14:  # More than 2 weeks
                risk_factors["no_check_ins"] += 1
    
    total = len(objectives)
    return {
        "risk_factors": risk_factors,
        "risk_percentages": {k: round((v/total)*100, 1) for k, v in risk_factors.items()},
        "high_risk_count": sum(1 for obj in objectives if count_risk_factors(obj) >= 2)
    }

def get_team_performance(objectives):
    """Get team and individual performance data"""
    team_data = {}
    individual_data = {}
    
    for obj in objectives:
        if obj.responsible_person:
            person = obj.responsible_person
            if obj.okr_type == 'Team':
                if person not in team_data:
                    team_data[person] = {"objectives": [], "avg_progress": 0, "avg_confidence": 0}
                team_data[person]["objectives"].append(obj)
            elif obj.okr_type == 'Individual':
                if person not in individual_data:
                    individual_data[person] = {"objectives": [], "avg_progress": 0, "avg_confidence": 0}
                individual_data[person]["objectives"].append(obj)
    
    # Calculate averages
    for person, data in team_data.items():
        if data["objectives"]:
            data["avg_progress"] = round(sum(obj.progress or 0 for obj in data["objectives"]) / len(data["objectives"]), 1)
            data["avg_confidence"] = round(sum(obj.confidence_level or 0 for obj in data["objectives"]) / len(data["objectives"]), 1)
    
    for person, data in individual_data.items():
        if data["objectives"]:
            data["avg_progress"] = round(sum(obj.progress or 0 for obj in data["objectives"]) / len(data["objectives"]), 1)
            data["avg_confidence"] = round(sum(obj.confidence_level or 0 for obj in data["objectives"]) / len(data["objectives"]), 1)
    
    return {
        "team_performance": team_data,
        "individual_performance": individual_data
    }

# Helper functions
def get_measurables_summary(objective_name):
    """Get measurable summary for an objective"""
    try:
        doc = frappe.get_doc("Objective", objective_name)
        return doc.get_measurable_summary()
    except:
        return {
            "total": 0,
            "completed": 0,
            "in_progress": 0,
            "not_started": 0,
            "at_risk": 0,
            "on_track": 0,
            "ahead_of_schedule": 0,
            "average_progress": 0,
            "average_confidence": 0
        }

def calculate_health_score(objective):
    """Calculate health score for an objective"""
    try:
        doc = frappe.get_doc("Objective", objective.name)
        summary = doc.get_measurable_summary()
        return summary.get('overall_health', 0)
    except:
        return 0

def calculate_days_remaining(objective):
    """Calculate days remaining for an objective"""
    if not objective.target_date:
        return None
    
    today = getdate()
    target = getdate(objective.target_date)
    return (target - today).days

def get_status_category(objective):
    """Get status category for an objective"""
    if objective.progress == 100:
        return 'completed'
    
    days_remaining = calculate_days_remaining(objective)
    if days_remaining is None:
        return 'no_deadline'
    
    progress_ratio = objective.progress / 100
    
    if days_remaining < 0:
        return 'overdue'
    elif days_remaining <= 7:
        if progress_ratio < 0.8:
            return 'at_risk'
        elif progress_ratio >= 1.0:
            return 'ahead_schedule'
        else:
            return 'on_track'
    else:
        if progress_ratio < 0.6:
            return 'at_risk'
        elif progress_ratio >= 1.0:
            return 'ahead_schedule'
        else:
            return 'on_track'

def is_at_risk(objective):
    """Check if objective is at risk"""
    return get_status_category(objective) == 'at_risk'

def get_child_objectives(parent_name):
    """Get child objectives for a parent"""
    children = frappe.get_all(
        "Objective",
        filters={"parent_company_okr": parent_name},
        fields=["name", "title", "progress", "okr_type", "responsible_person"],
        order_by="creation desc"
    )
    
    for child in children:
        child['measurables_summary'] = get_measurables_summary(child.name)
        child['status_category'] = get_status_category(child)
    
    return children

def count_risk_factors(objective):
    """Count risk factors for an objective"""
    risk_count = 0
    
    if calculate_days_remaining(objective) and calculate_days_remaining(objective) < 0:
        risk_count += 1
    
    if objective.confidence_level and objective.confidence_level < 50:
        risk_count += 1
    
    if objective.progress and objective.progress < 30:
        risk_count += 1
    
    return risk_count

def get_empty_stats():
    """Return empty statistics structure"""
    return {
        "total": 0,
        "completed": 0,
        "in_progress": 0,
        "not_started": 0,
        "at_risk": 0,
        "on_track": 0,
        "ahead_schedule": 0,
        "overall_progress": 0,
        "avg_confidence": 0,
        "avg_okr_score": 0,
        "completion_rate": 0,
        "risk_rate": 0,
        "type_distribution": {"company": 0, "team": 0, "individual": 0},
        "timeline": {"overdue": 0, "due_soon": 0, "on_time": 0}
    }

@frappe.whitelist()
def get_objective_details(objective_name):
    """Get detailed information for a specific objective"""
    try:
        doc = frappe.get_doc("Objective", objective_name)
        return {
            "objective": doc.as_dict(),
            "measurables_summary": doc.get_measurable_summary(),
            "risk_summary": doc.get_risk_summary(),
            "child_objectives": get_child_objectives(objective_name)
        }
    except Exception as e:
        frappe.log_error(f"Error getting objective details: {str(e)}")
        return {"error": str(e)}

@frappe.whitelist()
def export_dashboard_data(filters=None, format="excel"):
    """Export dashboard data"""
    try:
        if filters:
            filters = json.loads(filters)
        else:
            filters = {}
        
        objectives = get_filtered_objectives(filters)
        
        if format == "excel":
            return export_to_excel(objectives)
        elif format == "csv":
            return export_to_csv(objectives)
        elif format == "pdf":
            return export_to_pdf(objectives)
        else:
            return {"error": "Unsupported format"}
    except Exception as e:
        frappe.log_error(f"Error exporting dashboard data: {str(e)}")
        return {"error": str(e)}

def export_to_excel(objectives):
    """Export data to Excel format"""
    # Implementation for Excel export
    return {"message": "Excel export functionality to be implemented"}

def export_to_csv(objectives):
    """Export data to CSV format"""
    # Implementation for CSV export
    return {"message": "CSV export functionality to be implemented"}

def export_to_pdf(objectives):
    """Export data to PDF format"""
    # Implementation for PDF export
    return {"message": "PDF export functionality to be implemented"} 