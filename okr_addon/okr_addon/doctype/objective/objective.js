// Copyright (c) 2025, Phamos and contributors
// For license information, please see license.txt

frappe.ui.form.on("Objective", {
	refresh(frm) {
		// Render measurable summary in the form
		render_measurable_summary_form(frm);
		
		// Add market-standard features
		addMarketStandardFeatures(frm);
	},
	
	measurables_add(frm, cdt, cdn) {
		// Handle when a new measurable is added
		let measurable = frm.get_doc(cdt, cdn);
		if (measurable) {
			// Set default values
			if (!measurable.percent_complete) {
				measurable.percent_complete = 0;
			}
		}
		frm.refresh_field('measurables');
		update_progress(frm);
		render_measurable_summary_form(frm);
	},
	
	measurables_remove(frm, cdt, cdn) {
		// Handle when a measurable is removed
		frm.refresh_field('measurables');
		update_progress(frm);
		render_measurable_summary_form(frm);
	},
	
	measurables_percent_complete(frm, cdt, cdn) {
		// Update progress when percent complete changes
		update_progress(frm);
		render_measurable_summary_form(frm);
	},
	
	measurables_baseline_value(frm, cdt, cdn) {
		// Handle baseline value changes
		let measurable = frm.get_doc(cdt, cdn);
		if (measurable && measurable.baseline_value && measurable.target_value) {
			validate_measurable_values(measurable);
		}
	},
	
	measurables_target_value(frm, cdt, cdn) {
		// Handle target value changes
		let measurable = frm.get_doc(cdt, cdn);
		if (measurable && measurable.baseline_value && measurable.target_value) {
			validate_measurable_values(measurable);
		}
	}
});

// Function to update progress
function update_progress(frm) {
	frm.save('Update').then(() => {
		frm.refresh_field('progress');
	});
}

// Function to validate measurable values
function validate_measurable_values(measurable) {
	if (measurable.baseline_value && measurable.target_value) {
		if (measurable.baseline_value == measurable.target_value) {
			frappe.msgprint({
				title: __('Validation Error'),
				message: __('Baseline value cannot be equal to target value'),
				indicator: 'red'
			});
		}
	}
}

// Render measurable summary in the form
function render_measurable_summary_form(frm) {
	let measurables = frm.doc.measurables || [];
	
	if (measurables.length === 0) {
		// Show empty state in dashboard
		let empty_html = `
			<div style="text-align: center; padding: 20px; color: #7f8c8d;">
				<div style="font-size: 2em; margin-bottom: 10px;">📊</div>
				<div style="font-weight: 600; margin-bottom: 5px;">No Measurables</div>
				<div style="font-size: 0.9em;">Add measurables to see progress summary</div>
			</div>
		`;
		frm.dashboard.add_section(
			__('📊 Measurable Summary'),
			empty_html,
			'measurable_summary'
		);
		return;
	}
	
	let summary = {
		total: measurables.length,
		completed: 0,
		in_progress: 0,
		not_started: 0,
		average_progress: 0,
		on_track: 0,
		at_risk: 0,
		overdue: 0
	};
	
	let total_progress = 0;
	
	measurables.forEach(function(measurable, index) {
		if (measurable.percent_complete === 100) {
			summary.completed++;
		} else if (measurable.percent_complete > 0) {
			summary.in_progress++;
		} else {
			summary.not_started++;
		}
		
		if (measurable.percent_complete >= 80) {
			summary.on_track++;
		} else if (measurable.percent_complete >= 40) {
			summary.at_risk++;
		} else {
			summary.overdue++;
		}
		
		if (measurable.percent_complete) {
			total_progress += measurable.percent_complete;
		}
	});
	
	summary.average_progress = summary.total > 0 ? (total_progress / summary.total).toFixed(1) : 0;
	let overall_progress = summary.total > 0 ? (total_progress / summary.total) : 0;
	let progress_color = get_progress_color(overall_progress);
	
	let card_html = `
		<div style="width: 100%;">
			<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
				<!-- Stats Grid -->
				<div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; padding: 20px; border-bottom: 1px solid #e1e8ed;">
					<div style="text-align: center;">
						<div style="font-size: 2em; font-weight: 700; color: #27ae60;">${summary.total}</div>
						<div style="color: #7f8c8d;">Total</div>
					</div>
					<div style="text-align: center;">
						<div style="font-size: 2em; font-weight: 700; color: #27ae60;">${summary.completed}</div>
						<div style="color: #7f8c8d;">✅ Completed</div>
					</div>
					<div style="text-align: center;">
						<div style="font-size: 2em; font-weight: 700; color: #f39c12;">${summary.in_progress}</div>
						<div style="color: #7f8c8d;">🔄 In Progress</div>
					</div>
					<div style="text-align: center;">
						<div style="font-size: 2em; font-weight: 700; color: #e74c3c;">${summary.not_started}</div>
						<div style="color: #7f8c8d;">⏳ Not Started</div>
					</div>
				</div>
				
				<!-- Progress Overview -->
				<div style="padding: 10px;">
					<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
						<div style="font-weight: 600; color: #2c3e50;">Progress Overview</div>
						<div style="font-weight: bold;">${summary.average_progress}% avg</div>
					</div>
					<div style="background: #f8f9fa; border-radius: 6px; height: 8px; overflow: hidden;">
						<div style="background: linear-gradient(90deg, #27ae60, #2ecc71); height: 100%; width: ${overall_progress}%; transition: width 0.3s ease;"></div>
					</div>
				</div>
			</div>
		</div>
	`;
	
	// Add the summary to form dashboard with collapsible functionality
	frm.dashboard.add_section(
		card_html,
		__('📊 Measurable Summary')
		
	);
}

// Helper functions for enhanced UI
function get_progress_color(percentage) {
	if (percentage >= 80) return '#27ae60'; // Green
	if (percentage >= 60) return '#f39c12'; // Orange
	if (percentage >= 40) return '#3498db'; // Blue
	if (percentage >= 20) return '#e67e22'; // Dark Orange
	return '#e74c3c'; // Red
}
 
function get_status_icon(percentage) {
	if (percentage === 100) return '✅';
	if (percentage >= 80) return '🚀';
	if (percentage >= 60) return '📈';
	if (percentage >= 40) return '🔄';
	if (percentage >= 20) return '⚠️';
	return '⏳';
}

function get_progress_status(percentage) {
	if (percentage === 100) return 'Completed';
	if (percentage >= 80) return 'Near Completion';
	if (percentage >= 60) return 'Good Progress';
	if (percentage >= 40) return 'Halfway';
	if (percentage >= 20) return 'Early Stage';
	return 'Not Started';
}

// Market-standard features for enhanced UX
function addMarketStandardFeatures(frm) {
	// Add achievement badges
	addAchievementBadges(frm);
	
	// Add risk indicators
	addRiskIndicators(frm);
	
	// Add performance metrics
	addPerformanceMetrics(frm);
	
	// Add collaboration features
	addCollaborationFeatures(frm);
	
	// Add export/share functionality
	addExportShareFeatures(frm);
}

// Add achievement badges
function addAchievementBadges(frm) {
	let measurables = frm.doc.measurables || [];
	let completedCount = measurables.filter(m => m.percent_complete === 100).length;
	let totalCount = measurables.length;
	
	if (totalCount > 0) {
		let completionRate = (completedCount / totalCount) * 100;
		let badge = '';
		
		if (completionRate === 100) {
			badge = '<span class="badge badge-success" style="margin-left: 10px;">🏆 Perfect Score</span>';
		} else if (completionRate >= 80) {
			badge = '<span class="badge badge-info" style="margin-left: 10px;">⭐ High Achiever</span>';
		} else if (completionRate >= 60) {
			badge = '<span class="badge badge-warning" style="margin-left: 10px;">📈 On Track</span>';
		}
		
		if (badge) {
			// Add badge to the title field
			let titleField = frm.get_field('title');
			if (titleField) {
				titleField.$wrapper.find('.control-value').append(badge);
			}
		}
	}
}

// Add risk indicators
function addRiskIndicators(frm) {
	let measurables = frm.doc.measurables || [];
	let atRiskCount = 0;
	let overdueCount = 0;
	
	measurables.forEach(measurable => {
		if (measurable.percent_complete < 40 && measurable.percent_complete > 0) {
			atRiskCount++;
		} else if (measurable.percent_complete === 0) {
			overdueCount++;
		}
	});
	
	let riskIndicator = '';
	if (atRiskCount > 0) {
		riskIndicator += `<div class="alert alert-warning" style="margin: 10px 0;">
			⚠️ ${atRiskCount} measurable(s) at risk
		</div>`;
	}
	if (overdueCount > 0) {
		riskIndicator += `<div class="alert alert-danger" style="margin: 10px 0;">
			🚨 ${overdueCount} measurable(s) overdue
		</div>`;
	}
	
	if (riskIndicator) {
		// Add risk indicators to the form
		let riskContainer = frm.wrapper.find('.risk-indicators');
		if (riskContainer.length === 0) {
			riskContainer = $('<div class="risk-indicators"></div>');
			frm.wrapper.find('.form-section:first').after(riskContainer);
		}
		riskContainer.html(riskIndicator);
	}
}

// Add performance metrics
function addPerformanceMetrics(frm) {
	let measurables = frm.doc.measurables || [];
	let totalProgress = 0;
	let avgProgress = 0;
	
	if (measurables.length > 0) {
		totalProgress = measurables.reduce((sum, m) => sum + (m.percent_complete || 0), 0);
		avgProgress = totalProgress / measurables.length;
	}
	
	let metricsHtml = `
		<div class="performance-metrics" style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 10px 0;">
			<div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px;">
				<div style="text-align: center;">
					<div style="font-size: 1.5em; font-weight: 700; color: #2c3e50;">${measurables.length}</div>
					<div style="font-size: 0.8em; color: #7f8c8d;">Total Measurables</div>
				</div>
				<div style="text-align: center;">
					<div style="font-size: 1.5em; font-weight: 700; color: #27ae60;">${avgProgress.toFixed(1)}%</div>
					<div style="font-size: 0.8em; color: #7f8c8d;">Average Progress</div>
				</div>
				<div style="text-align: center;">
					<div style="font-size: 1.5em; font-weight: 700; color: #3498db;">${frm.doc.progress || 0}%</div>
					<div style="font-size: 0.8em; color: #7f8c8d;">Overall Progress</div>
				</div>
			</div>
		</div>
	`;
	
	// Add metrics to the form
	let metricsContainer = frm.wrapper.find('.performance-metrics-container');
	if (metricsContainer.length === 0) {
		metricsContainer = $('<div class="performance-metrics-container"></div>');
		frm.wrapper.find('.form-section:first').after(metricsContainer);
	}
	metricsContainer.html(metricsHtml);
}

// Add collaboration features
function addCollaborationFeatures(frm) {
	// Add comment section
	let commentHtml = `
		<div class="collaboration-section" style="margin: 15px 0;">
			<h6 style="margin-bottom: 10px;">💬 Comments & Updates</h6>
			<div class="comment-input" style="margin-bottom: 10px;">
				<textarea class="form-control" placeholder="Add a comment or update..." rows="3"></textarea>
			</div>
			<button class="btn btn-sm btn-primary" onclick="addComment()">Add Comment</button>
		</div>
	`;
	
	// Add collaboration section
	let collabContainer = frm.wrapper.find('.collaboration-container');
	if (collabContainer.length === 0) {
		collabContainer = $('<div class="collaboration-container"></div>');
		frm.wrapper.find('.form-section:last').after(collabContainer);
	}
	collabContainer.html(commentHtml);
}

// Add export/share features
function addExportShareFeatures(frm) {
	// Add export button
	frm.add_custom_button(__('📊 Export Report'), function() {
		exportObjectiveReport(frm);
	}, __('Actions'));
	
	// Add share button
	frm.add_custom_button(__('📤 Share'), function() {
		shareObjective(frm);
	}, __('Actions'));
}

// Export objective report
function exportObjectiveReport(frm) {
	frappe.call({
		method: 'okr_addon.okr_addon.page.okr_dashboard.okr_dashboard.export_dashboard',
		args: { 
			format: 'pdf',
			objective_name: frm.doc.name 
		},
		callback: function(r) {
			if (r.message && r.message.file_url) {
				window.open(r.message.file_url, '_blank');
			}
		}
	});
}

// Share objective
function shareObjective(frm) {
	frappe.msgprint({
		title: __('Share Objective'),
		message: __('Sharing functionality will be implemented here.'),
		indicator: 'blue'
	});
}

// Add comment function
function addComment() {
	frappe.msgprint({
		title: __('Comment Added'),
		message: __('Comment functionality will be implemented here.'),
		indicator: 'green'
	});
}
