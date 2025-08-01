// ============================================================================
// OKR Dashboard - Modular Architecture
// ============================================================================

// Global Configuration
const OKR_DASHBOARD_CONFIG = {
    CHART_HEIGHT: 300,
    DEFAULT_FILTERS: {
        date_range: '',
        okr_type: '',
        responsible_person: '',
        from_date: '',
        to_date: ''
    },
    PROGRESS_THRESHOLDS: {
        EXCELLENT: 80,
        GOOD: 60,
        FAIR: 40,
        POOR: 20
    },
    OKR_SCORE_THRESHOLDS: {
        EXCELLENT: 0.8,
        GOOD: 0.6,
        FAIR: 0.4
    },
    CHART_COLORS: {
        EXCELLENT: '#27ae60',
        GOOD: '#3498db',
        FAIR: '#f39c12',
        POOR: '#e67e22',
        CRITICAL: '#e74c3c',
        OVERDUE: '#e74c3c',
        DUE_SOON: '#f39c12',
        ON_TIME: '#27ae60'
    }
};

// Global State Management
const DashboardState = {
    data: {},
    filters: { ...OKR_DASHBOARD_CONFIG.DEFAULT_FILTERS },
    
    updateData(newData) {
        this.data = newData;
    },
    
    updateFilters(newFilters) {
        this.filters = { ...this.filters, ...newFilters };
    },
    
    resetFilters() {
        this.filters = { ...OKR_DASHBOARD_CONFIG.DEFAULT_FILTERS };
    }
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const DashboardUtils = {
    // Date formatting utilities
    formatDate(dateString, type = 'target') {
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
    },

    // OKR Score formatting
    formatOkrScore(score) {
        if (score === null || score === undefined || score === '') return 'N/A';
        return Math.round(score * 10) / 10;
    },

    // Progress classification
    getProgressClass(progress) {
        if (progress >= 100) return 'completed';
        if (progress > 0) return 'in-progress';
        return '';
    },

    // OKR Score classification
    getOkrScoreClass(score) {
        if (score === null || score === undefined || score === '') return 'no-score';
        if (score >= OKR_DASHBOARD_CONFIG.OKR_SCORE_THRESHOLDS.EXCELLENT) return 'excellent';
        if (score >= OKR_DASHBOARD_CONFIG.OKR_SCORE_THRESHOLDS.GOOD) return 'good';
        if (score >= OKR_DASHBOARD_CONFIG.OKR_SCORE_THRESHOLDS.FAIR) return 'fair';
        return 'poor';
    },

    // OKR Type utilities
    getOkrTypeClass(type) {
        const typeMap = {
            'Company': 'company',
            'Team': 'team',
            'Individual': 'individual'
        };
        return typeMap[type] || 'kr';
    },

    getOkrTypeLabel(type) {
        const labelMap = {
            'Company': 'Company',
            'Team': 'Team',
            'Individual': 'Individual'
        };
        return labelMap[type] || 'KR';
    },

    // DOM manipulation utilities
    createElement(tag, className, innerHTML) {
        const element = document.createElement(tag);
        if (className) element.className = className;
        if (innerHTML) element.innerHTML = innerHTML;
        return element;
    },

    // Chart configuration utilities
    getChartConfig(type, data, options = {}) {
        const baseConfig = {
            chart: {
                type: type,
                height: OKR_DASHBOARD_CONFIG.CHART_HEIGHT
            },
            title: {
                text: options.title || ''
            },
            ...options
        };
        
        return baseConfig;
    }
};

// ============================================================================
// FILTER MANAGEMENT
// ============================================================================

const FilterManager = {
    init() {
        this.bindFilterEvents();
        this.loadResponsiblePersons();
    },

    bindFilterEvents() {
        $('#date-filter').on('change', this.handleDateFilterChange.bind(this));
        $('#okr-type-filter').on('change', this.handleFilterChange.bind(this));
        $('#responsible-filter').on('change', this.handleFilterChange.bind(this));
        $('#from-date, #to-date').on('change', this.handleFilterChange.bind(this));
    },

    handleDateFilterChange() {
        const dateFilter = $('#date-filter').val();
        const customDateGroup = $('.custom-date-group');
        
        if (dateFilter === 'custom') {
            customDateGroup.show();
        } else {
            customDateGroup.hide();
        }
        
        this.handleFilterChange();
    },

    handleFilterChange() {
        const filters = this.getCurrentFilters();
        DashboardState.updateFilters(filters);
        DataManager.loadDashboardData();
    },

    getCurrentFilters() {
        return {
            date_range: $('#date-filter').val() || '',
            okr_type: $('#okr-type-filter').val() || '',
            responsible_person: $('#responsible-filter').val() || '',
            from_date: $('#from-date').val() || '',
            to_date: $('#to-date').val() || ''
        };
    },

    clearFilters() {
        $('#date-filter').val('');
        $('#okr-type-filter').val('');
        $('#responsible-filter').val('');
        $('.custom-date-group').hide();
        $('#from-date').val('');
        $('#to-date').val('');
        
        DashboardState.resetFilters();
        DataManager.loadDashboardData();
    },

    restoreFilters() {
        const filters = DashboardState.filters;
        if (filters.date_range) $('#date-filter').val(filters.date_range);
        if (filters.okr_type) $('#okr-type-filter').val(filters.okr_type);
        if (filters.responsible_person) $('#responsible-filter').val(filters.responsible_person);
        if (filters.from_date) $('#from-date').val(filters.from_date);
        if (filters.to_date) $('#to-date').val(filters.to_date);
        
        // Show custom date inputs if needed
        if (filters.date_range === 'custom') {
            $('.custom-date-group').show();
        }
    },

    loadResponsiblePersons() {
        frappe.call({
            method: 'frappe.client.get_list',
            args: {
                doctype: 'User',
                fields: ['name', 'full_name'],
                filters: { 'enabled': 1 }
            },
            callback: (r) => {
                const select = $('#responsible-filter');
                r.message.forEach(user => {
                    select.append(`<option value="${user.name}">${user.full_name || user.name}</option>`);
                });
            }
        });
    }
};

// ============================================================================
// DATA MANAGEMENT
// ============================================================================

const DataManager = {
    loadDashboardData() {
        frappe.call({
            method: 'okr_addon.okr_addon.page.okr_dashboard.okr_dashboard.get_dashboard_data',
            args: {
                filters: JSON.stringify(DashboardState.filters)
            },
            callback: (r) => {
                if (r.message) {
                    DashboardState.updateData(r.message);
                    DashboardRenderer.updateDashboard();
                } else {
                    console.log('No data received from server');
                }
            },
            error: (err) => {
                console.error('Error loading dashboard data:', err);
            }
        });
    }
};

// ============================================================================
// CHART MANAGEMENT
// ============================================================================

const ChartManager = {
    updateAllCharts() {
        this.updateProgressChart();
        this.updateTimelineChart();
        this.updateRiskChart();
        this.updateTrendsChart();
    },

    updateProgressChart() {
        const performanceMetrics = DashboardState.data.performance_metrics || {};
        const progressDist = performanceMetrics.progress_distribution || {};
        
        const chartData = [
            { name: 'Excellent', y: progressDist.excellent || 0, color: OKR_DASHBOARD_CONFIG.CHART_COLORS.EXCELLENT },
            { name: 'Good', y: progressDist.good || 0, color: OKR_DASHBOARD_CONFIG.CHART_COLORS.GOOD },
            { name: 'Fair', y: progressDist.fair || 0, color: OKR_DASHBOARD_CONFIG.CHART_COLORS.FAIR },
            { name: 'Poor', y: progressDist.poor || 0, color: OKR_DASHBOARD_CONFIG.CHART_COLORS.POOR },
            { name: 'Critical', y: progressDist.critical || 0, color: OKR_DASHBOARD_CONFIG.CHART_COLORS.CRITICAL }
        ];
        
        const config = DashboardUtils.getChartConfig('pie', chartData, {
            title: { text: 'Progress Distribution' },
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
        
        Highcharts.chart('progress-chart', config);
    },

    updateTimelineChart() {
        const timelineData = DashboardState.data.timeline_data || {};
        const stats = DashboardState.data.stats || {};
        
        const chartData = [
            { name: 'Overdue', y: stats.timeline?.overdue || 0, color: OKR_DASHBOARD_CONFIG.CHART_COLORS.OVERDUE },
            { name: 'Due Soon', y: stats.timeline?.due_soon || 0, color: OKR_DASHBOARD_CONFIG.CHART_COLORS.DUE_SOON },
            { name: 'On Time', y: stats.timeline?.on_time || 0, color: OKR_DASHBOARD_CONFIG.CHART_COLORS.ON_TIME }
        ];
        
        const config = DashboardUtils.getChartConfig('column', chartData, {
            title: { text: 'Timeline Analysis' },
            xAxis: {
                categories: ['Overdue', 'Due Soon', 'On Time']
            },
            yAxis: {
                title: { text: 'Number of Objectives' }
            },
            series: [{
                name: 'Objectives',
                data: chartData.map(item => item.y)
            }],
            plotOptions: {
                column: {
                    colorByPoint: true,
                    colors: [OKR_DASHBOARD_CONFIG.CHART_COLORS.OVERDUE, 
                             OKR_DASHBOARD_CONFIG.CHART_COLORS.DUE_SOON, 
                             OKR_DASHBOARD_CONFIG.CHART_COLORS.ON_TIME]
                }
            }
        });
        
        Highcharts.chart('timeline-chart', config);
    },

    updateRiskChart() {
        const riskAnalysis = DashboardState.data.risk_analysis || {};
        const riskPercentages = riskAnalysis.risk_percentages || {};
        
        const chartData = [
            { name: 'Overdue', y: riskPercentages.overdue || 0 },
            { name: 'Low Confidence', y: riskPercentages.low_confidence || 0 },
            { name: 'Low Progress', y: riskPercentages.low_progress || 0 },
            { name: 'No Measurables', y: riskPercentages.no_measurables || 0 },
            { name: 'No Check-ins', y: riskPercentages.no_check_ins || 0 }
        ];
        
        const config = DashboardUtils.getChartConfig('bar', chartData, {
            title: { text: 'Risk Analysis' },
            xAxis: {
                categories: ['Overdue', 'Low Confidence', 'Low Progress', 'No Measurables', 'No Check-ins']
            },
            yAxis: {
                title: { text: 'Risk Percentage' }
            },
            series: [{
                name: 'Risk Percentage',
                data: chartData.map(item => item.y),
                color: OKR_DASHBOARD_CONFIG.CHART_COLORS.CRITICAL
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
        
        Highcharts.chart('risk-chart', config);
    },

    updateTrendsChart() {
        const timelineData = DashboardState.data.timeline_data || {};
        
        const labels = timelineData.labels || ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
        const progressData = timelineData.progress || [0, 0, 0, 0, 0, 0];
        const confidenceData = timelineData.confidence || [0, 0, 0, 0, 0, 0];
        
        const config = DashboardUtils.getChartConfig('line', null, {
            title: { text: 'Performance Trends' },
            xAxis: { categories: labels },
            yAxis: { title: { text: 'Percentage' } },
            series: [{
                name: 'Progress',
                data: progressData,
                color: OKR_DASHBOARD_CONFIG.CHART_COLORS.GOOD
            }, {
                name: 'Confidence',
                data: confidenceData,
                color: OKR_DASHBOARD_CONFIG.CHART_COLORS.EXCELLENT
            }],
            plotOptions: {
                line: {
                    marker: { enabled: true }
                }
            }
        });
        
        Highcharts.chart('trends-chart', config);
    }
};

// ============================================================================
// HIERARCHY MANAGEMENT
// ============================================================================

const HierarchyManager = {
    buildHierarchy(objectives) {
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
    },

    createHierarchyRow(item, level) {
        const hasChildren = item.children && item.children.length > 0;
        
        const row = `
            <tr class="hierarchy-row level-${level}" data-level="${level}" data-id="${item.name}" data-parent="${item.parent_company_okr || ''}">
                <td>
                    <div style="display: flex; align-items: center;">
                        <span class="hierarchy-indicator collapsed" onclick="HierarchyManager.toggleHierarchy(this)" style="display: ${hasChildren ? 'inline-block' : 'none'}">
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
                    <span class="okr-type-badge ${DashboardUtils.getOkrTypeClass(item.okr_type)}">${DashboardUtils.getOkrTypeLabel(item.okr_type)}</span>
                </td>
                <td>
                    <div class="progress-wrapper">
                        <div class="progress">
                            <div class="progress-bar ${DashboardUtils.getProgressClass(item.progress)}" style="width: ${item.progress || 0}%"></div>
                        </div>
                        <small>${Math.round(item.progress || 0)}%</small>
                    </div>
                </td>
                <td>
                    <span class="okr-score ${DashboardUtils.getOkrScoreClass(item.okr_score)}">${DashboardUtils.formatOkrScore(item.okr_score)}</span>
                </td>
                <td>${DashboardUtils.formatDate(item.target_date, 'target')}</td>
                <td>${DashboardUtils.formatDate(item.last_check_in, 'checkin')}</td>
                <td>
                    <span class="group-badge">${item.responsible_person || 'Unassigned'}</span>
                </td>
            </tr>
        `;
        
        let html = row;
        
        // Add children
        if (hasChildren) {
            item.children.forEach(child => {
                html += this.createHierarchyRow(child, level + 1);
            });
        }
        
        return html;
    },

    toggleHierarchy(element) {
        const indicator = $(element);
        const row = indicator.closest('tr');
        const id = row.data('id');
        const hasChildren = $(`.hierarchy-row[data-parent="${id}"]`).length > 0;
        
        if (!hasChildren) return;
        
        if (indicator.hasClass('expanded')) {
            // Collapse
            indicator.removeClass('expanded').addClass('collapsed');
            indicator.find('i').removeClass('fa-chevron-down').addClass('fa-chevron-right');
            $(`.hierarchy-row[data-parent="${id}"]`).hide();
        } else {
            // Expand
            indicator.removeClass('collapsed').addClass('expanded');
            indicator.find('i').removeClass('fa-chevron-right').addClass('fa-chevron-down');
            $(`.hierarchy-row[data-parent="${id}"]`).show();
        }
    },

    expandAll() {
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
    },

    collapseAll() {
        $('.hierarchy-indicator').each(function() {
            const indicator = $(this);
            indicator.removeClass('expanded').addClass('collapsed');
            indicator.find('i').removeClass('fa-chevron-down').addClass('fa-chevron-right');
        });
        $('.hierarchy-row[data-level="1"], .hierarchy-row[data-level="2"], .hierarchy-row[data-level="3"]').hide();
    }
};

// ============================================================================
// DASHBOARD RENDERER
// ============================================================================

const DashboardRenderer = {
    updateDashboard() {
        this.updateMetrics();
        ChartManager.updateAllCharts();
        this.renderHierarchicalTable();
        FilterManager.restoreFilters();
    },

    updateMetrics() {
        const stats = DashboardState.data.stats || {};
        
        $('#total-objectives').text(stats.total || 0);
        $('#completed-objectives').text(stats.completed || 0);
        $('#in-progress-objectives').text(stats.in_progress || 0);
        $('#at-risk-objectives').text(stats.at_risk || 0);
        $('#overall-progress').text((stats.overall_progress || 0) + '%');
        $('#health-score').text(stats.avg_health_score || 0);
    },

    renderHierarchicalTable() {
        const objectives = DashboardState.data.objectives || [];
        const tbody = $('#hierarchy-tbody');
        tbody.empty();
        
        const hierarchy = HierarchyManager.buildHierarchy(objectives);
        
        hierarchy.forEach(item => {
            const row = HierarchyManager.createHierarchyRow(item, 0);
            tbody.append(row);
        });
    }
};

// ============================================================================
// UI CONTROLS
// ============================================================================

const UIControls = {
    toggleSidebar() {
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
    },

    toggleChart(chartId) {
        const chartContainer = $(`#${chartId}`).closest('.chart-container');
        chartContainer.toggleClass('expanded');
        
        // Trigger chart resize
        const chart = Highcharts.charts.find(c => c.renderTo.id === chartId);
        if (chart) {
            setTimeout(() => chart.reflow(), 100);
        }
    },

    addScrollListener() {
        $(window).on('scroll', function() {
            const sidebar = $('.dashboard-sidebar');
            if ($(window).scrollTop() > 40) {
                sidebar.addClass('scrolled');
            } else {
                sidebar.removeClass('scrolled');
            }
        });
    }
};

// ============================================================================
// MAIN DASHBOARD INITIALIZATION
// ============================================================================

frappe.pages['okr_dashboard'].on_page_load = function (wrapper) {
    const page = frappe.ui.make_app_page({
        parent: wrapper,
        title: 'OKR Dashboard',
        single_column: true
    });

    DashboardInitializer.init(page);
};

const DashboardInitializer = {
    init(page) {
        this.addToggleButton();
        this.renderPageLayout(page);
        this.initializeComponents();
        this.loadInitialData();
    },

    addToggleButton() {
        const toggleButton = `
            <button class="sidebar-toggle" onclick="UIControls.toggleSidebar()">
                <i class="fa fa-navicon"></i>
            </button>
        `;
        $('.page-head-content').prepend(toggleButton);
    },

    renderPageLayout(page) {
        $(page.body).html(this.getPageTemplate());
    },

    getPageTemplate() {
        return `
            <div class="okr-dashboard-container">
                <!-- Sidebar Filters -->
                <div class="dashboard-sidebar">
                    <div class="sidebar-header">
                        <h4><i class="fa fa-filter"></i> Filters</h4>
                        <button class="btn btn-secondary btn-sm clear-filter-btn" onclick="FilterManager.clearFilters()">
                            <i class="fa fa-times"></i> Clear
                        </button>
                    </div>
                    <div class="sidebar-content">
                        <div class="filter-group">
                            <label>Date Range:</label>
                            <div class="custom-select-wrapper">
                                <select id="date-filter" class="custom-select">
                                    <option value="all">All Time</option>
                                    <option value="this_month">This Month</option>
                                    <option value="this_quarter">This Quarter</option>
                                    <option value="custom">Custom Range</option>
                                </select>
                            </div>
                        </div>
                        <div class="filter-group custom-date-group" style="display: none;">
                            <label>From Date:</label>
                            <input type="date" id="from-date" class="form-control">
                        </div>
                        <div class="filter-group custom-date-group" style="display: none;">
                            <label>To Date:</label>
                            <input type="date" id="to-date" class="form-control">
                        </div>

                        <div class="filter-group">
                            <label>OKR Type:</label>
                            <div class="custom-select-wrapper">
                                <select id="okr-type-filter" class="custom-select">
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
                                <select id="responsible-filter" class="custom-select">
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
                                        <button class="btn btn-sm btn-outline-secondary" onclick="UIControls.toggleChart('progress-chart')">
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
                                        <button class="btn btn-sm btn-outline-secondary" onclick="UIControls.toggleChart('timeline-chart')">
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
                                        <button class="btn btn-sm btn-outline-secondary" onclick="UIControls.toggleChart('risk-chart')">
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
                                        <button class="btn btn-sm btn-outline-secondary" onclick="UIControls.toggleChart('trends-chart')">
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
                                    <button class="btn btn-sm btn-outline-primary" onclick="HierarchyManager.expandAll()">
                                        <i class="fas fa-expand"></i> Expand All
                                    </button>
                                    <button class="btn btn-sm btn-outline-secondary" onclick="HierarchyManager.collapseAll()">
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
        `;
    },

    initializeComponents() {
        FilterManager.init();
        UIControls.addScrollListener();
    },

    loadInitialData() {
        DataManager.loadDashboardData();
    }
};