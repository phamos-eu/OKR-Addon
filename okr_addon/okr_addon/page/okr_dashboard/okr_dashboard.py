import frappe
from frappe import _
from datetime import datetime, timedelta
import json

def get_context(context):
    context.no_cache = 1
    context.title = _("OKR Dashboard")

@frappe.whitelist()
def get_dashboard_data():
    """Get comprehensive dashboard data"""
    try:
        # Get all objectives
        objectives = frappe.get_all(
            "Objective",
            fields=["name", "title", "progress", "responsible_person", "target_date", "creation", "modified"],
            order_by="creation desc"
        )
        
        # Calculate statistics
        stats = calculate_dashboard_stats(objectives)
        
        # Get progress timeline
        progress_timeline = get_progress_timeline()
        
        # Get status distribution
        status_distribution = get_status_distribution(objectives)
        
        # Get measurable counts for each objective
        for objective in objectives:
            objective.measurables_count = get_measurables_count(objective.name)
        
        return {
            "objectives": objectives,
            "stats": stats,
            "progress_timeline": progress_timeline,
            "status_distribution": status_distribution
        }
    except Exception as e:
        frappe.log_error(f"Error in get_dashboard_data: {str(e)}")
        return {"error": str(e)}

def calculate_dashboard_stats(objectives):
    """Calculate dashboard statistics"""
    total = len(objectives)
    completed = sum(1 for obj in objectives if obj.progress == 100)
    in_progress = sum(1 for obj in objectives if 0 < obj.progress < 100)
    not_started = sum(1 for obj in objectives if obj.progress == 0)
    
    overall_progress = 0
    if total > 0:
        overall_progress = sum(obj.progress or 0 for obj in objectives) / total
    
    return {
        "total": total,
        "completed": completed,
        "in_progress": in_progress,
        "not_started": not_started,
        "overall_progress": round(overall_progress, 1)
    }

def get_progress_timeline():
    """Get progress timeline data for charts"""
    # Get last 12 months
    months = []
    data = []
    
    for i in range(11, -1, -1):
        date = datetime.now() - timedelta(days=30*i)
        month_name = date.strftime("%b")
        months.append(month_name)
        
        # Calculate average progress for this month
        start_date = date.replace(day=1)
        end_date = (start_date + timedelta(days=32)).replace(day=1) - timedelta(days=1)
        
        objectives = frappe.get_all(
            "Objective",
            filters={
                "creation": ["between", [start_date, end_date]]
            },
            fields=["progress"]
        )
        
        avg_progress = 0
        if objectives:
            avg_progress = sum(obj.progress or 0 for obj in objectives) / len(objectives)
        
        data.append(round(avg_progress, 1))
    
    return {
        "labels": months,
        "data": data
    }

def get_status_distribution(objectives):
    """Get status distribution for charts"""
    completed = sum(1 for obj in objectives if obj.progress == 100)
    in_progress = sum(1 for obj in objectives if 0 < obj.progress < 100)
    not_started = sum(1 for obj in objectives if obj.progress == 0)
    
    return {
        "completed": completed,
        "in_progress": in_progress,
        "not_started": not_started
    }

def get_measurables_count(objective_name):
    """Get measurable count for an objective"""
    return frappe.db.count("Measurable", filters={"parent": objective_name})

@frappe.whitelist()
def get_objective_details(objective_name):
    """Get detailed objective information for modal"""
    try:
        objective = frappe.get_doc("Objective", objective_name)
        measurables = frappe.get_all(
            "Measurable",
            filters={"parent": objective_name},
            fields=["*"]
        )
        
        # Calculate measurable statistics
        measurable_stats = {
            "total": len(measurables),
            "completed": sum(1 for m in measurables if m.percent_complete == 100),
            "in_progress": sum(1 for m in measurables if 0 < m.percent_complete < 100),
            "not_started": sum(1 for m in measurables if m.percent_complete == 0)
        }
        
        html = f"""
        <div class="objective-details">
            <div class="detail-header">
                <h4>{objective.title}</h4>
                <div class="progress-indicator">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: {objective.progress or 0}%;"></div>
                    </div>
                    <span class="progress-text">{objective.progress or 0}% Complete</span>
                </div>
            </div>
            
            <div class="detail-content">
                <div class="detail-section">
                    <h5>Description</h5>
                    <p>{objective.description or 'No description available'}</p>
                </div>
                
                <div class="detail-section">
                    <h5>Measurables ({measurable_stats['total']})</h5>
                    <div class="measurable-stats">
                        <span class="stat-item">✅ {measurable_stats['completed']} Completed</span>
                        <span class="stat-item">🔄 {measurable_stats['in_progress']} In Progress</span>
                        <span class="stat-item">⏳ {measurable_stats['not_started']} Not Started</span>
                    </div>
                </div>
                
                <div class="measurables-list">
                    {render_measurables_list(measurables)}
                </div>
            </div>
        </div>
        """
        
        return html
    except Exception as e:
        frappe.log_error(f"Error in get_objective_details: {str(e)}")
        return f"<div class='error'>Error loading objective details: {str(e)}</div>"

def render_measurables_list(measurables):
    """Render measurable list HTML"""
    if not measurables:
        return "<p class='text-muted'>No measurables found.</p>"
    
    html = "<div class='measurables-grid'>"
    for measurable in measurables:
        progress_color = get_progress_color(measurable.percent_complete or 0)
        html += f"""
        <div class="measurable-item">
            <div class="measurable-header">
                <h6>{measurable.metric_name or 'Untitled'}</h6>
                <span class="progress-badge" style="background: {progress_color};">{measurable.percent_complete or 0}%</span>
            </div>
            <div class="measurable-details">
                <span>Baseline: {measurable.baseline_value or 0}</span>
                <span>Target: {measurable.target_value or 0}</span>
                <span>Current: {measurable.current_value or 0}</span>
            </div>
        </div>
        """
    html += "</div>"
    return html

def get_progress_color(progress):
    """Get color based on progress percentage"""
    if progress >= 80:
        return '#27ae60'
    elif progress >= 60:
        return '#f39c12'
    elif progress >= 40:
        return '#3498db'
    elif progress >= 20:
        return '#e67e22'
    else:
        return '#e74c3c'

@frappe.whitelist()
def get_activity_timeline():
    """Get recent activity timeline"""
    try:
        # Get recent objectives
        objectives = frappe.get_all(
            "Objective",
            fields=["name", "title", "creation", "modified", "progress"],
            order_by="modified desc",
            limit=10
        )
        
        activities = []
        
        for objective in objectives:
            # Creation activity
            activities.append({
                "type": "created",
                "icon": "📝",
                "text": f"Created objective: {objective.title}",
                "time": frappe.utils.pretty_date(objective.creation)
            })
            
            # Progress activity (if progress > 0)
            if objective.progress and objective.progress > 0:
                activities.append({
                    "type": "progress",
                    "icon": "📈",
                    "text": f"Updated progress for {objective.title}: {objective.progress}%",
                    "time": frappe.utils.pretty_date(objective.modified)
                })
        
        # Sort by time (most recent first)
        activities.sort(key=lambda x: x["time"], reverse=True)
        
        return activities[:15]  # Return top 15 activities
    except Exception as e:
        frappe.log_error(f"Error in get_activity_timeline: {str(e)}")
        return []

@frappe.whitelist()
def filter_dashboard_data(date_filter, status_filter, from_date=None, to_date=None):
    """Filter dashboard data based on criteria"""
    try:
        filters = {}
        
        # Date filter
        if date_filter != "all":
            if date_filter == "this-month":
                start_date = datetime.now().replace(day=1)
                end_date = (start_date + timedelta(days=32)).replace(day=1) - timedelta(days=1)
            elif date_filter == "last-month":
                start_date = (datetime.now().replace(day=1) - timedelta(days=1)).replace(day=1)
                end_date = datetime.now().replace(day=1) - timedelta(days=1)
            elif date_filter == "this-quarter":
                current_month = datetime.now().month
                quarter_start_month = ((current_month - 1) // 3) * 3 + 1
                start_date = datetime.now().replace(month=quarter_start_month, day=1)
                end_date = datetime.now()
            elif date_filter == "custom" and from_date and to_date:
                start_date = datetime.strptime(from_date, "%Y-%m-%d")
                end_date = datetime.strptime(to_date, "%Y-%m-%d")
            
            if date_filter != "custom" or (from_date and to_date):
                filters["creation"] = ["between", [start_date, end_date]]
        
        # Status filter
        if status_filter != "all":
            if status_filter == "completed":
                filters["progress"] = 100
            elif status_filter == "in-progress":
                filters["progress"] = [">", 0]
                filters["progress"] = ["<", 100]
            elif status_filter == "not-started":
                filters["progress"] = 0
        
        objectives = frappe.get_all(
            "Objective",
            filters=filters,
            fields=["name", "title", "progress", "responsible_person", "target_date", "creation", "modified"],
            order_by="creation desc"
        )
        
        # Calculate statistics
        stats = calculate_dashboard_stats(objectives)
        
        # Get measurable counts
        for objective in objectives:
            objective.measurables_count = get_measurables_count(objective.name)
        
        return {
            "objectives": objectives,
            "stats": stats
        }
    except Exception as e:
        frappe.log_error(f"Error in filter_dashboard_data: {str(e)}")
        return {"error": str(e)}

@frappe.whitelist()
def export_dashboard(format="pdf"):
    """Export dashboard data"""
    try:
        # Get dashboard data
        data = get_dashboard_data()
        
        if format == "pdf":
            return export_to_pdf(data)
        elif format == "excel":
            return export_to_excel(data)
        elif format == "csv":
            return export_to_csv(data)
        else:
            return {"error": "Unsupported format"}
    except Exception as e:
        frappe.log_error(f"Error in export_dashboard: {str(e)}")
        return {"error": str(e)}

def export_to_pdf(data):
    """Export to PDF"""
    # This would integrate with Frappe's PDF generation
    # For now, return a placeholder
    return {
        "file_url": "/api/method/okr_addon.okr_addon.page.okr_dashboard.okr_dashboard.generate_pdf",
        "filename": f"okr_dashboard_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
    }

def export_to_excel(data):
    """Export to Excel"""
    # This would integrate with Frappe's Excel generation
    return {
        "file_url": "/api/method/okr_addon.okr_addon.page.okr_dashboard.okr_dashboard.generate_excel",
        "filename": f"okr_dashboard_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
    }

def export_to_csv(data):
    """Export to CSV"""
    # This would integrate with Frappe's CSV generation
    return {
        "file_url": "/api/method/okr_addon.okr_addon.page.okr_dashboard.okr_dashboard.generate_csv",
        "filename": f"okr_dashboard_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    } 