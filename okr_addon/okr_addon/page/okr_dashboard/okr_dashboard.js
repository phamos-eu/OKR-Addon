// Global variables
var dashboardData = {};
var currentFilters = {};

frappe.pages['okr_dashboard'].on_page_load = function (wrapper) {
    const page = frappe.ui.make_app_page({
        parent: wrapper,
        title: 'OKR Dashboard',
        single_column: true
    });

    // Initialize dashboard
    initializeDashboard(page);
};

function initializeDashboard(page) {
    // Add toggle button to page header
    const toggleButton = `
        <button class="sidebar-toggle" onclick="toggleSidebar()">
            <i class="fa fa-navicon"></i>
        </button>
    `;
    
    // Prepend toggle button to page-head-content
    $('.page-head-content').prepend(toggleButton);
    
    // Page Layout
    $(page.body).html(`
        <div class="okr-dashboard-container">
            <!-- Sidebar Filters -->
            <div class="dashboard-sidebar">
                <div class="sidebar-header">
                    <h4><i class="fa fa-filter"></i> Filters</h4>
                    <button class="btn btn-secondary btn-sm clear-filter-btn" onclick="clearFilters()">
                        <i class="fa fa-times"></i> Clear
                    </button>
                </div>
                <div class="sidebar-content">
                    <div class="filter-group">
                        <label>Date Range:</label>
                        <div class="custom-select-wrapper">
                            <select id="date-filter" class="custom-select" onchange="applyFilters()">
                                <option value="all">All Time</option>
                                <option value="this_month">This Month</option>
                                <option value="this_quarter">This Quarter</option>
                                <option value="custom">Custom Range</option>
                            </select>
                        </div>
                    </div>
                    <div class="filter-group custom-date-group" style="display: none;">
                        <label>From Date:</label>
                        <input type="date" id="from-date" class="form-control" onchange="applyFilters()">
                    </div>
                    <div class="filter-group custom-date-group" style="display: none;">
                        <label>To Date:</label>
                        <input type="date" id="to-date" class="form-control" onchange="applyFilters()">
                    </div>

                    <div class="filter-group">
                        <label>OKR Type:</label>
                        <div class="custom-select-wrapper">
                            <select id="okr-type-filter" class="custom-select" onchange="applyFilters()">
                                <option value="">All Types</option>
                                <option value="Company">Company</option>
                                <option value="Team">Team</option>
                                <option value="Individual">Individual</option>
                            </select>
                        </div>
                    </div>
                    <div class="filter-group">
                        <label>Responsible Person:</label>
                        <div class="custom-select-wrapper">
                            <select id="responsible-filter" class="custom-select" onchange="applyFilters()">
                                <option value="">All People</option>
                            </select>
                        </div>
                    </div>

                </div>
            </div>
            <!-- Main Content Area -->
            <div class="dashboard-main">
                <!-- Key Metrics Section -->
                <div class="metrics-section">
                    <div class="metrics-grid">
                        <div class="metric-card">
                            <div class="metric-icon">
                                <i class="fa fa-bullseye"></i>
                            </div>
                            <div class="metric-content">
                                <div class="metric-value" id="total-objectives">0</div>
                                <div class="metric-label">Total Objectives</div>
                            </div>
                        </div>
                        <div class="metric-card">
                            <div class="metric-icon">
                                <i class="fa fa-check"></i>
                            </div>
                            <div class="metric-content">
                                <div class="metric-value" id="completed-objectives">0</div>
                                <div class="metric-label">Completed</div>
                            </div>
                        </div>
                        <div class="metric-card">
                            <div class="metric-icon">
                                <i class="fa fa-clock-o"></i>
                            </div>
                            <div class="metric-content">
                                <div class="metric-value" id="in-progress-objectives">0</div>
                                <div class="metric-label">In Progress</div>
                            </div>
                        </div>
                        <div class="metric-card">
                            <div class="metric-icon">
                                <i class="fa fa-exclamation-triangle"></i>
                            </div>
                            <div class="metric-content">
                                <div class="metric-value" id="at-risk-objectives">0</div>
                                <div class="metric-label">At Risk</div>
                            </div>
                        </div>
                        <div class="metric-card">
                            <div class="metric-icon">
                                <i class="fa fa-bar-chart"></i>
                            </div>
                            <div class="metric-content">
                                <div class="metric-value" id="overall-progress">0%</div>
                                <div class="metric-label">Overall Progress</div>
                            </div>
                        </div>
                        <div class="metric-card">
                            <div class="metric-icon">
                                <i class="fa fa-heartbeat"></i>
                            </div>
                            <div class="metric-content">
                                <div class="metric-value" id="health-score">0</div>
                                <div class="metric-label">Health Score</div>
                            </div>
                        </div>
                    </div>
                </div>

            <!-- Charts Section -->
            <div class="charts-section">
                <div class="chart-row">
                    <div class="chart-container">
                        <div class="chart-header">
                            <h4>Progress Distribution</h4>
                            <div class="chart-actions">
                                <button class="btn btn-sm btn-outline-secondary" onclick="toggleChart('progress-chart')">
                                    <i class="fas fa-expand"></i>
                                </button>
                            </div>
                        </div>
                        <div class="chart-body" id="progress-chart"></div>
                    </div>
                    <div class="chart-container">
                        <div class="chart-header">
                            <h4>Timeline Analysis</h4>
                            <div class="chart-actions">
                                <button class="btn btn-sm btn-outline-secondary" onclick="toggleChart('timeline-chart')">
                                    <i class="fas fa-expand"></i>
                                </button>
                            </div>
                        </div>
                        <div class="chart-body" id="timeline-chart"></div>
                    </div>
                </div>
                <div class="chart-row">
                    <div class="chart-container">
                        <div class="chart-header">
                            <h4>Risk Analysis</h4>
                            <div class="chart-actions">
                                <button class="btn btn-sm btn-outline-secondary" onclick="toggleChart('risk-chart')">
                                    <i class="fas fa-expand"></i>
                                </button>
                            </div>
                        </div>
                        <div class="chart-body" id="risk-chart"></div>
                    </div>
                    <div class="chart-container">
                        <div class="chart-header">
                            <h4>Performance Trends</h4>
                            <div class="chart-actions">
                                <button class="btn btn-sm btn-outline-secondary" onclick="toggleChart('trends-chart')">
                                    <i class="fas fa-expand"></i>
                                </button>
                            </div>
                        </div>
                        <div class="chart-body" id="trends-chart"></div>
                    </div>
                </div>
            </div>

            <!-- Hierarchical Table Section -->
            <div class="objectives-section">
                <div class="hierarchical-table">
                    <div class="table-header">
                        <h3>Objectives and Key Results</h3>
                        <div class="table-actions">
                            <button class="btn btn-sm btn-outline-primary" onclick="expandAll()">
                                <i class="fas fa-expand"></i> Expand All
                            </button>
                            <button class="btn btn-sm btn-outline-secondary" onclick="collapseAll()">
                                <i class="fas fa-compress"></i> Collapse All
                            </button>
                        </div>
                    </div>
                    <div class="table-responsive">
                        <table class="hierarchy-table" id="hierarchy-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Description</th>
                                    <th>OKR Type</th>
                                    <th>Progress</th>
                                    <th>OKR Score</th>
                                    <th>Target Date</th>
                                    <th>Last Check-In</th>
                                    <th>Owner</th>
                                </tr>
                            </thead>
                            <tbody id="hierarchy-tbody">
                                <!-- Data will be populated here -->
                            </tbody>
                        </table>
                    </div>
                </div>
                </div>
            </div>
        </div>
    `);

    // Initialize currentFilters with default values
    currentFilters = {
        date_range: '',
        okr_type: '',
        responsible_person: '',
        from_date: '',
        to_date: ''
    };
    
    // Load initial data
    loadDashboardData();
    
    // Load responsible persons for filter
    loadResponsiblePersons();
    
    // Add scroll event listener for sidebar
    $(window).on('scroll', function() {
        const sidebar = $('.dashboard-sidebar');
        if ($(window).scrollTop() > 40) {
            sidebar.addClass('scrolled');
        } else {
            sidebar.removeClass('scrolled');
        }
    });
}

// Global functions for event handlers
window.handleFilterChange = function() {
    const filters = {
        date_range: $('#date-filter').val(),
        okr_type: $('#okr-type-filter').val(),
        responsible_person: $('#responsible-filter').val(),
        from_date: $('#from-date').val(),
        to_date: $('#to-date').val()
    };

    // Show/hide custom date inputs
    if (filters.date_range === 'custom') {
        $('.custom-date-group').show();
    } else {
        $('.custom-date-group').hide();
    }

    currentFilters = filters;
    loadDashboardData();
};

window.toggleCustomDates = function() {
    const dateFilter = $('#date-filter').val();
    if (dateFilter === 'custom') {
        $('.custom-date-group').show();
    } else {
        $('.custom-date-group').hide();
    }
};

window.applyFilters = function() {
    const dateFilter = $('#date-filter').val();
    const customDateGroup = $('.custom-date-group');
    
    // Show/hide custom date inputs
    if (dateFilter === 'custom') {
        customDateGroup.show();
    } else {
        customDateGroup.hide();
    }
    
    // Apply filters
    const filters = {
        date_range: $('#date-filter').val() || '',
        okr_type: $('#okr-type-filter').val() || '',
        responsible_person: $('#responsible-filter').val() || '',
        from_date: $('#from-date').val() || '',
        to_date: $('#to-date').val() || ''
    };
    
    currentFilters = filters;

    // Call the backend with filters
    frappe.call({
        method: 'okr_addon.okr_addon.page.okr_dashboard.okr_dashboard.get_dashboard_data',
        args: {
            filters: JSON.stringify(filters)
        },
        callback: function(r) {
            if (r.message) {
                dashboardData = r.message;
                updateDashboard();
            } else {
                console.log('No data received from server with filters');
            }
        },
        error: function(err) {
            console.error('Error applying filters:', err);
        }
    });
};

window.clearFilters = function() {
    $('#date-filter').val('');
    $('#okr-type-filter').val('');
    $('#responsible-filter').val('');
    $('.custom-date-group').hide();
    $('#from-date').val('');
    $('#to-date').val('');
    
    // Reset currentFilters to default values
    currentFilters = {
        date_range: '',
        okr_type: '',
        responsible_person: '',
        from_date: '',
        to_date: ''
    };
    
    console.log('Clearing filters, loading default data');
    loadDashboardData();
};

window.refreshDashboard = function() {
    loadDashboardData();
};

window.exportDashboard = function() {
    const format = 'excel'; // Default format
    frappe.call({
        method: 'okr_addon.okr_addon.page.okr_dashboard.okr_dashboard.export_dashboard_data',
        args: {
            filters: JSON.stringify(currentFilters),
            format: format
        },
        callback: function(r) {
            if (r.message) {
                frappe.msgprint({
                    title: 'Export',
                    message: r.message,
                    indicator: 'green'
                });
            }
        }
    });
};

window.expandAll = function() {
    $('.hierarchy-indicator').removeClass('collapsed').addClass('expanded');
    $('.hierarchy-row').show();
};

window.collapseAll = function() {
    $('.hierarchy-indicator').removeClass('expanded').addClass('collapsed');
    $('.hierarchy-row.level-1, .hierarchy-row.level-2, .hierarchy-row.level-3').hide();
};

window.toggleHierarchy = function(element) {
    const row = $(element).closest('.hierarchy-row');
    const level = parseInt(row.attr('data-level'));
    const id = row.attr('data-id');
    
    const indicator = $(element);
    const isExpanded = indicator.hasClass('expanded');
    const hasChildren = row.find('.hierarchy-indicator').length > 0;
    
    if (!hasChildren) return; // Don't toggle if no children
    
    if (isExpanded) {
        // Collapse - change to left arrow
        indicator.removeClass('expanded').addClass('collapsed');
        indicator.find('i').removeClass('fa-chevron-down').addClass('fa-chevron-right');
        // Hide all child rows
        $(`.hierarchy-row[data-parent="${id}"]`).hide();
    } else {
        // Expand - change to down arrow
        indicator.removeClass('collapsed').addClass('expanded');
        indicator.find('i').removeClass('fa-chevron-right').addClass('fa-chevron-down');
        // Show immediate children
        $(`.hierarchy-row[data-parent="${id}"]`).show();
    }
};

function toggleSidebar() {
    const sidebar = $('.dashboard-sidebar');
    const mainContent = $('.dashboard-main');
    const toggleBtn = $('.sidebar-toggle i');
    
    sidebar.toggleClass('collapsed');
    mainContent.toggleClass('sidebar-collapsed');
    
    if (sidebar.hasClass('collapsed')) {
        toggleBtn.removeClass('fa-navicon').addClass('fa-chevron-right');
    } else {
        toggleBtn.removeClass('fa-chevron-right').addClass('fa-navicon');
    }
}

function handleFilterChange() {
    const dateFilter = $('#date-filter').val();
    const customDateGroup = $('.custom-date-group');
    
    if (dateFilter === 'custom') {
        customDateGroup.show();
    } else {
        customDateGroup.hide();
    }
}

function applyFilters() {
    const dateFilter = $('#date-filter').val();
    const customDateGroup = $('.custom-date-group');
    
    // Show/hide custom date inputs
    if (dateFilter === 'custom') {
        customDateGroup.show();
    } else {
        customDateGroup.hide();
    }
    
    // Apply filters
    const filters = {
        date_range: $('#date-filter').val() || '',
        okr_type: $('#okr-type-filter').val() || '',
        responsible_person: $('#responsible-filter').val() || '',
        from_date: $('#from-date').val() || '',
        to_date: $('#to-date').val() || ''
    };
    
    currentFilters = filters;
    
    // Call the backend with filters
    frappe.call({
        method: 'okr_addon.okr_addon.page.okr_dashboard.okr_dashboard.get_dashboard_data',
        args: {
            filters: JSON.stringify(filters)
        },
        callback: function(r) {
            if (r.message) {
                dashboardData = r.message;
                updateDashboard();
            } else {
                console.log('No data received from server with filters');
            }
        },
        error: function(err) {
            console.error('Error applying filters:', err);
        }
    });
}

function clearFilters() {
    $('#date-filter').val('');
    $('#okr-type-filter').val('');
    $('#responsible-filter').val('');
    $('.custom-date-group').hide();
    $('#from-date').val('');
    $('#to-date').val('');
    
    // Reset currentFilters to default values
    currentFilters = {
        date_range: '',
        okr_type: '',
        responsible_person: '',
        from_date: '',
        to_date: ''
    };
    
    console.log('Clearing filters, loading default data');
    loadDashboardData();
}

function expandAll() {
    $('.hierarchy-indicator').each(function() {
        const indicator = $(this);
        const id = indicator.closest('tr').data('id');
        const hasChildren = $(`.hierarchy-row[data-parent="${id}"]`).length > 0;
        
        if (hasChildren) {
            indicator.removeClass('collapsed').addClass('expanded');
            indicator.find('i').removeClass('fa-chevron-right').addClass('fa-chevron-down');
            $(`.hierarchy-row[data-parent="${id}"]`).show();
        }
    });
}

function collapseAll() {
    $('.hierarchy-indicator').each(function() {
        const indicator = $(this);
        indicator.removeClass('expanded').addClass('collapsed');
        indicator.find('i').removeClass('fa-chevron-down').addClass('fa-chevron-right');
    });
    $('.hierarchy-row[data-level="1"], .hierarchy-row[data-level="2"], .hierarchy-row[data-level="3"]').hide();
}

function toggleHierarchy(element) {
    const indicator = $(element);
    const row = indicator.closest('tr');
    const id = row.data('id');
    const hasChildren = $(`.hierarchy-row[data-parent="${id}"]`).length > 0;
    
    if (!hasChildren) return;
    
    if (indicator.hasClass('expanded')) {
        // Collapse - change to right arrow
        indicator.removeClass('expanded').addClass('collapsed');
        indicator.find('i').removeClass('fa-chevron-down').addClass('fa-chevron-right');
        // Hide all child rows
        $(`.hierarchy-row[data-parent="${id}"]`).hide();
    } else {
        // Expand - change to down arrow
        indicator.removeClass('collapsed').addClass('expanded');
        indicator.find('i').removeClass('fa-chevron-right').addClass('fa-chevron-down');
        // Show immediate children
        $(`.hierarchy-row[data-parent="${id}"]`).show();
    }
}

function loadDashboardData() {
    // Ensure currentFilters is properly initialized
    if (!currentFilters || Object.keys(currentFilters).length === 0) {
        currentFilters = {
            date_range: '',
            okr_type: '',
            responsible_person: '',
            from_date: '',
            to_date: ''
        };
    }
    
    frappe.call({
        method: 'okr_addon.okr_addon.page.okr_dashboard.okr_dashboard.get_dashboard_data', 
        args: {
            filters: JSON.stringify(currentFilters)
        },
        callback: function(r) {
            if (r.message) {
                dashboardData = r.message;
                updateDashboard();
            } else {
                console.log('No data received from server');
                // Initialize with empty data to prevent errors
                dashboardData = {
                    stats: {},
                    objectives: [],
                    performance_metrics: {},
                    timeline_data: {},
                    risk_analysis: {},
                    trends_data: {}
                };
                updateDashboard();
            }
        },
        error: function(err) {
            console.error('Error loading dashboard data:', err);
            // Initialize with empty data to prevent errors
            dashboardData = {
                stats: {},
                objectives: [],
                performance_metrics: {},
                timeline_data: {},
                risk_analysis: {},
                trends_data: {}
            };
            updateDashboard();
        }
    });
}

function updateDashboard() {
    updateMetrics();
    updateCharts();
    renderHierarchicalTable();
    // Restore filter values after dashboard update
    setTimeout(function() {
        if (currentFilters) {
            if (currentFilters.date_range) {
                $('#date-filter').val(currentFilters.date_range);
            }
            if (currentFilters.okr_type) {
                $('#okr-type-filter').val(currentFilters.okr_type);
            }
            if (currentFilters.responsible_person) {
                $('#responsible-filter').val(currentFilters.responsible_person);
            }
            if (currentFilters.from_date) {
                $('#from-date').val(currentFilters.from_date);
            }
            if (currentFilters.to_date) {
                $('#to-date').val(currentFilters.to_date);
            }
        }
    }, 100);
}

function updateMetrics() {
    const stats = dashboardData.stats || {};
    
    $('#total-objectives').text(stats.total || 0);
    $('#completed-objectives').text(stats.completed || 0);
    $('#in-progress-objectives').text(stats.in_progress || 0);
    $('#at-risk-objectives').text(stats.at_risk || 0);
    $('#overall-progress').text((stats.overall_progress || 0) + '%');
    $('#health-score').text(stats.avg_health_score || 0);
}

function updateCharts() {
    updateProgressChart();
    updateTimelineChart();
    updateRiskChart();
    updateTrendsChart();
}

function updateProgressChart() {
    const performanceMetrics = dashboardData.performance_metrics || {};
    const progressDist = performanceMetrics.progress_distribution || {};
    
    const chartData = [
        { name: 'Excellent', y: progressDist.excellent || 0, color: '#27ae60' },
        { name: 'Good', y: progressDist.good || 0, color: '#3498db' },
        { name: 'Fair', y: progressDist.fair || 0, color: '#f39c12' },
        { name: 'Poor', y: progressDist.poor || 0, color: '#e67e22' },
        { name: 'Critical', y: progressDist.critical || 0, color: '#e74c3c' }
    ];
    
    Highcharts.chart('progress-chart', {
        chart: {
            type: 'pie',
            height: 300
        },
        title: {
            text: 'Progress Distribution'
        },
        series: [{
            name: 'Objectives',
            data: chartData
        }],
        plotOptions: {
            pie: {
                allowPointSelect: true,
                cursor: 'pointer',
                dataLabels: {
                    enabled: true,
                    format: '<b>{point.name}</b>: {point.percentage:.1f} %'
                }
            }
        }
    });
}

function updateTimelineChart() {
    const timelineData = dashboardData.timeline_data || {};
    const stats = dashboardData.stats || {};
    
    const chartData = [
        { name: 'Overdue', y: stats.timeline?.overdue || 0, color: '#e74c3c' },
        { name: 'Due Soon', y: stats.timeline?.due_soon || 0, color: '#f39c12' },
        { name: 'On Time', y: stats.timeline?.on_time || 0, color: '#27ae60' }
    ];
    
    Highcharts.chart('timeline-chart', {
        chart: {
            type: 'column',
            height: 300
        },
        title: {
            text: 'Timeline Analysis'
        },
        xAxis: {
            categories: ['Overdue', 'Due Soon', 'On Time']
        },
        yAxis: {
            title: {
                text: 'Number of Objectives'
            }
        },
        series: [{
            name: 'Objectives',
            data: chartData.map(item => item.y)
        }],
        plotOptions: {
            column: {
                colorByPoint: true,
                colors: ['#e74c3c', '#f39c12', '#27ae60']
            }
        }
    });
}

function updateRiskChart() {
    const riskAnalysis = dashboardData.risk_analysis || {};
    const riskPercentages = riskAnalysis.risk_percentages || {};
    
    const chartData = [
        { name: 'Overdue', y: riskPercentages.overdue || 0 },
        { name: 'Low Confidence', y: riskPercentages.low_confidence || 0 },
        { name: 'Low Progress', y: riskPercentages.low_progress || 0 },
        { name: 'No Measurables', y: riskPercentages.no_measurables || 0 },
        { name: 'No Check-ins', y: riskPercentages.no_check_ins || 0 }
    ];
    
    Highcharts.chart('risk-chart', {
        chart: {
            type: 'bar',
            height: 300
        },
        title: {
            text: 'Risk Analysis'
        },
        xAxis: {
            categories: ['Overdue', 'Low Confidence', 'Low Progress', 'No Measurables', 'No Check-ins']
        },
        yAxis: {
            title: {
                text: 'Risk Percentage'
            }
        },
        series: [{
            name: 'Risk Percentage',
            data: chartData.map(item => item.y),
            color: '#e74c3c'
        }],
        plotOptions: {
            bar: {
                dataLabels: {
                    enabled: true,
                    format: '{y}%'
                }
            }
        }
    });
}

function updateTrendsChart() {
    const timelineData = dashboardData.timeline_data || {};
    
    const labels = timelineData.labels || ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const progressData = timelineData.progress || [0, 0, 0, 0, 0, 0];
    const confidenceData = timelineData.confidence || [0, 0, 0, 0, 0, 0];
    
    Highcharts.chart('trends-chart', {
        chart: {
            type: 'line',
            height: 300
        },
        title: {
            text: 'Performance Trends'
        },
        xAxis: {
            categories: labels
        },
        yAxis: {
            title: {
                text: 'Percentage'
            }
        },
        series: [{
            name: 'Progress',
            data: progressData,
            color: '#3498db'
        }, {
            name: 'Confidence',
            data: confidenceData,
            color: '#27ae60'
        }],
        plotOptions: {
            line: {
                marker: {
                    enabled: true
                }
            }
        }
    });
}

function renderHierarchicalTable() {
    const objectives = dashboardData.objectives || [];
    const tbody = $('#hierarchy-tbody');
    tbody.empty();
    
    // Create hierarchical structure
    const hierarchy = buildHierarchy(objectives);
    
    // Render hierarchical rows
    hierarchy.forEach(item => {
        const row = createHierarchyRow(item, 0);
        tbody.append(row);
    });
}

function buildHierarchy(objectives) {
    const hierarchy = [];
    const lookup = {};
    
    // Create lookup table
    objectives.forEach(obj => {
        lookup[obj.name] = { ...obj, children: [] };
    });
    
    // Build hierarchy
    objectives.forEach(obj => {
        if (obj.parent_company_okr && lookup[obj.parent_company_okr]) {
            lookup[obj.parent_company_okr].children.push(lookup[obj.name]);
        } else {
            hierarchy.push(lookup[obj.name]);
        }
    });
    
    return hierarchy;
}

function createHierarchyRow(item, level) {
    const hasChildren = item.children && item.children.length > 0;
    const row = `
        <tr class="hierarchy-row level-${level}" data-level="${level}" data-id="${item.name}" data-parent="${item.parent_company_okr || ''}">
            <td>
                <div style="display: flex; align-items: center;">
                    <span class="hierarchy-indicator collapsed" onclick="toggleHierarchy(this)" style="display: ${hasChildren ? 'inline-block' : 'none'}">
                        <i class="fa fa-chevron-right"></i>
                    </span>
                    ${item.name}
                </div>
            </td>
            <td>
                <div style="display: flex; align-items: center;">
                    ${item.title}
                </div>
            </td>
            <td>
                <span class="okr-type-badge ${getOkrTypeClass(item.okr_type)}">${getOkrTypeLabel(item.okr_type)}</span>
            </td>
            <td>
                <div class="progress-wrapper">
                    <div class="progress">
                        <div class="progress-bar ${getProgressClass(item.progress)}" style="width: ${item.progress || 0}%"></div>
                    </div>
                    <small>${Math.round(item.progress || 0)}%</small>
                </div>
            </td>
            <td>
                <span class="okr-score ${getOkrScoreClass(item.okr_score)}">${formatOkrScore(item.okr_score)}</span>
            </td>
            <td>${formatDate(item.target_date, 'target')}</td>
            <td>${formatDate(item.last_check_in, 'checkin')}</td>
            <td>
                <span class="group-badge">${item.responsible_person || 'Unassigned'}</span>
            </td>
        </tr>
    `;
    
    let html = row;
    
    // Add children
    if (hasChildren) {
        item.children.forEach(child => {
            html += createHierarchyRow(child, level + 1);
        });
    }
    
    return html;
}

function getTypeClass(type) {
    switch(type) {
        case 'Company': return 'company';
        case 'Team': return 'team';
        case 'Individual': return 'individual';
        default: return 'kr';
    }
}

function getTypeLabel(type) {
    switch(type) {
        case 'Company': return 'C';
        case 'Team': return 'T';
        case 'Individual': return 'I';
        default: return 'KR';
    }
}

function getProgressClass(progress) {
    if (progress >= 100) return 'completed';
    if (progress > 0) return 'in-progress';
    return '';
}

function getIntervalLabel(cadence) {
    switch(cadence) {
        case 'Annual': return 'Y2023';
        case 'Quarterly': return 'Q1\'2023';
        case 'Monthly': return 'M1\'2023';
        default: return 'Q1\'2023';
    }
}

function getOkrTypeClass(type) {
    switch(type) {
        case 'Company': return 'company';
        case 'Team': return 'team';
        case 'Individual': return 'individual';
        default: return 'kr';
    }
}

function getOkrTypeLabel(type) {
    switch(type) {
        case 'Company': return 'Company';
        case 'Team': return 'Team';
        case 'Individual': return 'Individual';
        default: return 'KR';
    }
}

function formatDate(dateString, type = 'target') {
    if (!dateString) {
        return type === 'checkin' ? 'Never' : 'Not Set';
    }
    
    try {
        const date = new Date(dateString);
        
        if (type === 'checkin') {
            const now = new Date();
            const diffTime = Math.abs(now - date);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays === 0) return 'Today';
            if (diffDays === 1) return 'Yesterday';
            if (diffDays <= 7) return `${diffDays} days ago`;
        }
        
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    } catch (e) {
        return 'Invalid Date';
    }
}

function formatOkrScore(score) {
    if (score === null || score === undefined || score === '') return 'N/A';
    return Math.round(score * 10) / 10; // Round to 1 decimal place
}

function getOkrScoreClass(score) {
    if (score === null || score === undefined || score === '') return 'no-score';
    if (score >= 0.8) return 'excellent';
    if (score >= 0.6) return 'good';
    if (score >= 0.4) return 'fair';
    return 'poor';
}

function loadResponsiblePersons() {
    frappe.call({
        method: 'frappe.client.get_list',
        args: {
            doctype: 'User',
            fields: ['name', 'full_name'],
            filters: { 'enabled': 1 }
        },
        callback: function(r) {
            const select = $('#responsible-filter');
            r.message.forEach(user => {
                select.append(`<option value="${user.name}">${user.full_name || user.name}</option>`);
            });
        }
    });
} 