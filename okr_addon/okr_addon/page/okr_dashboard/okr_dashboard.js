frappe.pages['okr_dashboard'].on_page_load = function (wrapper) {
    const page = frappe.ui.make_app_page({
        parent: wrapper,
        title: 'OKR Dashboard',
        single_column: true
    });

    // Page Layout
    $(page.body).html(`
        <div class="okr-dashboard-container">
            <!-- Header Section -->
            <div class="dashboard-header">
                <div class="header-content">
                </div>
                <div class="dashboard-stats">
                    <div class="stat-card">
                        <div class="circular-progress">
                            <div class="progress-ring">
                                <svg class="progress-ring-svg" width="80" height="80">
                                    <circle class="progress-ring-circle-bg" cx="40" cy="40" r="32" stroke-width="4"></circle>
                                    <circle class="progress-ring-circle" cx="40" cy="40" r="32" stroke-width="4" stroke-dasharray="201" stroke-dashoffset="201"></circle>
                                </svg>
                                <div class="progress-text" id="total-objectives">0</div>
                            </div>
                        </div>
                        <div class="stat-content">
                            <div class="stat-label">Total Objectives</div>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="circular-progress">
                            <div class="progress-ring">
                                <svg class="progress-ring-svg" width="80" height="80">
                                    <circle class="progress-ring-circle-bg" cx="40" cy="40" r="32" stroke-width="4"></circle>
                                    <circle class="progress-ring-circle" cx="40" cy="40" r="32" stroke-width="4" stroke-dasharray="201" stroke-dashoffset="201"></circle>
                                </svg>
                                <div class="progress-text" id="completed-objectives">0</div>
                            </div>
                        </div>
                        <div class="stat-content">
                            <div class="stat-label">Completed</div>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="circular-progress">
                            <div class="progress-ring">
                                <svg class="progress-ring-svg" width="80" height="80">
                                    <circle class="progress-ring-circle-bg" cx="40" cy="40" r="32" stroke-width="4"></circle>
                                    <circle class="progress-ring-circle" cx="40" cy="40" r="32" stroke-width="4" stroke-dasharray="201" stroke-dashoffset="201"></circle>
                                </svg>
                                <div class="progress-text" id="in-progress-objectives">0</div>
                            </div>
                        </div>
                        <div class="stat-content">
                            <div class="stat-label">In Progress</div>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="circular-progress">
                            <div class="progress-ring">
                                <svg class="progress-ring-svg" width="80" height="80">
                                    <circle class="progress-ring-circle-bg" cx="40" cy="40" r="32" stroke-width="4"></circle>
                                    <circle class="progress-ring-circle" cx="40" cy="40" r="32" stroke-width="4" stroke-dasharray="201" stroke-dashoffset="201"></circle>
                                </svg>
                                <div class="progress-text" id="overall-progress">0%</div>
                            </div>
                        </div>
                        <div class="stat-content">
                            <div class="stat-label">Overall Progress</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Filters Section -->
            <div class="filters-section">
                <div class="filter-group">
                    <label>Date Range:</label>
                    <select id="date-filter" onchange="toggleCustomDates()">
                        <option value="all">All Time</option>
                        <option value="this-month">This Month</option>
                        <option value="last-month">Last Month</option>
                        <option value="this-quarter">This Quarter</option>
                        <option value="custom">Custom Range</option>
                    </select>
                </div>
                <div class="filter-group custom-date-group" style="display: none;">
                    <label>From Date:</label>
                    <input type="date" id="from-date" class="form-control" onchange="filterData()">
                </div>
                <div class="filter-group custom-date-group" style="display: none;">
                    <label>To Date:</label>
                    <input type="date" id="to-date" class="form-control" onchange="filterData()">
                </div>
                <div class="filter-group">
                    <label>Status:</label>
                    <select id="status-filter" onchange="filterData()">
                        <option value="all">All Status</option>
                        <option value="completed">Completed</option>
                        <option value="in-progress">In Progress</option>
                        <option value="not-started">Not Started</option>
                    </select>
                </div>

            </div>

            <!-- Main Dashboard Content -->
            <div class="dashboard-content">
                <!-- Charts Section -->
                <div class="charts-section">
                    <div class="chart-card">
                        <div class="chart-header">
                            <h3>Progress Overview</h3>
                            <div class="chart-actions">
                                <button class="btn btn-sm" onclick="toggleChart('progress-chart')">
                                    <i class="fas fa-expand"></i>
                                </button>
                            </div>
                        </div>
                        <div class="chart-content">
                            <div id="progress-chart" style="height: 400px;"></div>
                        </div>
                    </div>
                    
                    <div class="chart-card">
                        <div class="chart-header">
                            <h3>Status Distribution</h3>
                            <div class="chart-actions">
                                <button class="btn btn-sm" onclick="toggleChart('status-chart')">
                                    <i class="fas fa-expand"></i>
                                </button>
                            </div>
                        </div>
                        <div class="chart-content">
                            <div id="status-chart" style="height: 400px;"></div>
                        </div>
                    </div>
                </div>



            </div>
        </div>
    `);

    // Global variables
    let objectivesData = [];
    let charts = {};

    // Initialize dashboard
    loadDashboardData();
    initializeCharts();

    // Load dashboard data
    function loadDashboardData() {
        frappe.call({
            method: 'okr_addon.okr_addon.page.okr_dashboard.okr_dashboard.get_dashboard_data',
            callback: function(r) {
                try {
                    if (r.message && !r.message.error) {
                        objectivesData = r.message.objectives || [];
                        updateDashboardStats(r.message.stats || {});
                        updateCharts(r.message);
                    } else {
                        console.error('Error loading dashboard data:', r.message?.error || 'Unknown error');
                        objectivesData = [];
                        updateDashboardStats({total: 0, completed: 0, in_progress: 0, not_started: 0, overall_progress: 0});
                    }
                } catch (error) {
                    console.error('Error processing dashboard data:', error);
                }
            },
            error: function(err) {
                console.error('Failed to load dashboard data:', err);
            }
        });
    }

    // Update dashboard statistics
    function updateDashboardStats(stats) {
        const total = stats.total || 0;
        const completed = stats.completed || 0;
        const inProgress = stats.in_progress || 0;
        const overallProgress = stats.overall_progress || 0;
        
        // Update text values
        $('#total-objectives').text(total);
        $('#completed-objectives').text(completed);
        $('#in-progress-objectives').text(inProgress);
        $('#overall-progress').text(overallProgress + '%');
        
        // Animate circular progress indicators
        animateCircularProgress('total-objectives', 100, 100); // Always fully filled for total
        animateCircularProgress('completed-objectives', completed, total);
        animateCircularProgress('in-progress-objectives', inProgress, total);
        animateCircularProgress('overall-progress', overallProgress, 100);
    }
    
    // Animate circular progress
    function animateCircularProgress(elementId, value, max) {
        const percentage = max > 0 ? (value / max) * 100 : 0;
        const circle = $(`#${elementId}`).closest('.stat-card').find('.progress-ring-circle');
        const radius = 32;
        const circumference = 2 * Math.PI * radius;
        const offset = circumference - (percentage / 100) * circumference;
        
        circle.css('stroke-dasharray', circumference);
        circle.css('stroke-dashoffset', offset);
    }

    // Initialize charts
    function initializeCharts() {
        try {
            // Progress Chart
            charts.progressChart = Highcharts.chart('progress-chart', {
                chart: {
                    type: 'line',
                    backgroundColor: 'transparent',
                    style: {
                        fontFamily: 'inherit'
                    }
                },
                title: {
                    text: 'Progress Timeline',
                    style: {
                        fontSize: '16px',
                        fontWeight: 'bold',
                        color: '#2c3e50'
                    }
                },
                xAxis: {
                    categories: [],
                    labels: {
                        style: {
                            color: '#7f8c8d'
                        }
                    }
                },
                yAxis: {
                    title: {
                        text: 'Progress (%)',
                        style: {
                            color: '#7f8c8d'
                        }
                    },
                    min: 0,
                    max: 100,
                    labels: {
                        style: {
                            color: '#7f8c8d'
                        }
                    }
                },
                legend: {
                    enabled: false
                },
                plotOptions: {
                    line: {
                        marker: {
                            enabled: true,
                            radius: 4
                        },
                        lineWidth: 3
                    }
                },
                series: [{
                    name: 'Progress',
                    data: [],
                    color: '#667eea',
                    fillOpacity: 0.1
                }],
                credits: {
                    enabled: false
                },
                exporting: {
                    enabled: true,
                    buttons: {
                        contextButton: {
                            menuItems: ['downloadPNG', 'downloadPDF', 'downloadCSV']
                        }
                    }
                }
            });

            // Status Chart
            charts.status = Highcharts.chart('status-chart', {
                chart: {
                    type: 'pie',
                    backgroundColor: 'transparent',
                    style: {
                        fontFamily: 'inherit'
                    }
                },
                title: {
                    text: 'Status Distribution',
                    style: {
                        fontSize: '16px',
                        fontWeight: 'bold',
                        color: '#2c3e50'
                    }
                },
                plotOptions: {
                    pie: {
                        allowPointSelect: true,
                        cursor: 'pointer',
                        dataLabels: {
                            enabled: true,
                            format: '<b>{point.name}</b>: {point.percentage:.1f}%'
                        },
                        showInLegend: true
                    }
                },
                series: [{
                    name: 'Objectives',
                    colorByPoint: true,
                    data: [
                        { name: 'Completed', y: 0, color: '#27ae60' },
                        { name: 'In Progress', y: 0, color: '#f39c12' },
                        { name: 'Not Started', y: 0, color: '#e74c3c' }
                    ]
                }],
                credits: {
                    enabled: false
                },
                exporting: {
                    enabled: true,
                    buttons: {
                        contextButton: {
                            menuItems: ['downloadPNG', 'downloadPDF', 'downloadCSV']
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Error initializing charts:', error);
        }
    }

    // Update charts with data
    function updateCharts(data) {
        try {
            // Update progress chart
            if (data.progress_timeline && charts.progressChart) {
                const progressData = data.progress_timeline.data || [];
                const labels = data.progress_timeline.labels || [];
                
                charts.progressChart.xAxis[0].setCategories(labels);
                charts.progressChart.series[0].setData(progressData);
            }

            // Update status chart
            if (data.status_distribution && charts.status) {
                const statusData = [
                    { name: 'Completed', y: data.status_distribution.completed || 0, color: '#27ae60' },
                    { name: 'In Progress', y: data.status_distribution.in_progress || 0, color: '#f39c12' },
                    { name: 'Not Started', y: data.status_distribution.not_started || 0, color: '#e74c3c' }
                ];
                
                charts.status.series[0].setData(statusData);
            }
        } catch (error) {
            console.error('Error updating charts:', error);
        }
    }





    // Toggle custom date inputs
    function toggleCustomDates() {
        const dateFilter = $('#date-filter').val();
        if (dateFilter === 'custom') {
            $('.custom-date-group').show();
        } else {
            $('.custom-date-group').hide();
            $('#from-date').val('');
            $('#to-date').val('');
        }
        filterData();
    }

    // Filter data
    function filterData() {
        const dateFilter = $('#date-filter').val();
        const fromDate = $('#from-date').val();
        const toDate = $('#to-date').val();
        const statusFilter = $('#status-filter').val();

        frappe.call({
            method: 'okr_addon.okr_addon.page.okr_dashboard.okr_dashboard.filter_dashboard_data',
            args: {
                date_filter: dateFilter,
                from_date: fromDate,
                to_date: toDate,
                status_filter: statusFilter
            },
            callback: function(r) {
                if (r.message) {
                    objectivesData = r.message.objectives || [];
                    updateDashboardStats(r.message.stats);
                    updateCharts(r.message);
                }
            }
        });
    }

    // Export dashboard
    function exportDashboard() {
        frappe.msgprint({
            title: 'Export Dashboard',
            message: 'Export functionality will be implemented soon.',
            indicator: 'green'
        });
    }

    // Refresh dashboard
    function refreshDashboard() {
        $('.okr-dashboard-container').addClass('loading');
        loadDashboardData();
        setTimeout(() => {
            $('.okr-dashboard-container').removeClass('loading');
        }, 1000);
    }

    // Toggle chart
    function toggleChart(chartId) {
        const chartElement = document.getElementById(chartId);
        if (chartElement.requestFullscreen) {
            chartElement.requestFullscreen();
        }
    }

    // Make functions globally available
    window.exportDashboard = exportDashboard;
    window.refreshDashboard = refreshDashboard;
    window.toggleChart = toggleChart;
    window.filterData = filterData;
    window.toggleCustomDates = toggleCustomDates;
}; 