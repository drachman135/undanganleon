// js/components/analyticsPanel.js
'use strict';

/**
 * Manages rendering the analytics dashboard using inline SVG donut segments
 * and CSS-animated vertical bars for zero-dependency high performance.
 */
class AnalyticsPanel {
    constructor({
        ratioChartEl,
        ratioPercentageEl,
        ratioLegendEl,
        distributionChartEl,
        totalAttendeesEl
    }) {
        this.ratioChart = ratioChartEl;
        this.ratioPercentage = ratioPercentageEl;
        this.ratioLegend = ratioLegendEl;
        this.distributionChart = distributionChartEl;
        this.totalAttendees = totalAttendeesEl;
    }

    /**
     * Re-calculate metrics and update the graphics.
     * @param {Array} rsvpData 
     */
    update(rsvpData) {
        if (!rsvpData) return;

        const total = rsvpData.length;
        const hadirCount = rsvpData.filter(r => r.attendance_status === 'hadir').length;
        const tidakHadirCount = rsvpData.filter(r => r.attendance_status === 'tidak_hadir').length;

        // Sum guests capacity for confirmed attendees
        const totalAttendeesSum = rsvpData
            .filter(r => r.attendance_status === 'hadir')
            .reduce((sum, r) => sum + (r.guest_count || 0), 0);

        // 1. Update total attendees count
        if (this.totalAttendees) {
            this.totalAttendees.textContent = totalAttendeesSum.toLocaleString('id-ID');
        }

        // 2. Render Donut Ratio Chart
        this.renderDonutChart(total, hadirCount, tidakHadirCount);

        // 3. Render Distribution Bar Chart
        this.renderBarChart(hadirCount, tidakHadirCount);
    }

    /**
     * Draw the circular SVG donut ring.
     */
    renderDonutChart(total, hadir, tidakHadir) {
        if (!this.ratioChart) return;

        const hadirPercent = total > 0 ? (hadir / total) * 100 : 0;
        const tidakHadirPercent = total > 0 ? (tidakHadir / total) * 100 : 0;

        // Circumference calculation for circle with r=36
        // C = 2 * PI * r = 226.195
        const circum = 226.195;
        
        // Offset represents the length of the empty outline segment
        const hadirOffset = circum - (circum * hadirPercent) / 100;
        const tidakHadirOffset = circum - (circum * tidakHadirPercent) / 100;

        // SVG Drawing
        this.ratioChart.innerHTML = `
            <!-- Gray Background Circle -->
            <circle cx="50" cy="50" r="36" fill="none" stroke="rgba(255, 255, 255, 0.03)" stroke-width="8"></circle>
            
            <!-- Confirmed Hadir Segment -->
            ${hadir > 0 ? `
            <circle cx="50" cy="50" r="36" fill="none" stroke="var(--green)" stroke-width="8"
                    stroke-dasharray="${circum}" stroke-dashoffset="${hadirOffset}"
                    stroke-linecap="round" transform="rotate(-90 50 50)" style="transition: stroke-dashoffset 0.6s ease;"></circle>
            ` : ''}
            
            <!-- Confirmed Absen Segment -->
            ${tidakHadir > 0 ? `
            <circle cx="50" cy="50" r="36" fill="none" stroke="var(--red)" stroke-width="8"
                    stroke-dasharray="${circum}" stroke-dashoffset="${tidakHadirOffset}"
                    stroke-linecap="round" transform="rotate(${-90 + (3.6 * hadirPercent)} 50 50)" style="transition: stroke-dashoffset 0.6s ease;"></circle>
            ` : ''}
        `;

        // Update center text (displays percentage of attendance)
        if (this.ratioPercentage) {
            this.ratioPercentage.textContent = total > 0 ? `${Math.round(hadirPercent)}%` : '0%';
        }

        // Update Legend label indicators
        if (this.ratioLegend) {
            this.ratioLegend.innerHTML = `
                <div class="legend-item">
                    <span class="legend-dot" style="background-color: var(--green);"></span>
                    Hadir: ${hadir} (${Math.round(hadirPercent)}%)
                </div>
                <div class="legend-item">
                    <span class="legend-dot" style="background-color: var(--red);"></span>
                    Absen: ${tidakHadir} (${Math.round(tidakHadirPercent)}%)
                </div>
            `;
        }
    }

    /**
     * Draw distribution bars.
     */
    renderBarChart(hadir, tidakHadir) {
        if (!this.distributionChart) return;

        const maxVal = Math.max(hadir, tidakHadir) || 1;
        const hadirHeight = (hadir / maxVal) * 100;
        const tidakHadirHeight = (tidakHadir / maxVal) * 100;

        // Populate column elements
        this.distributionChart.innerHTML = `
            <!-- Hadir Column -->
            <div class="chart-bar-col">
                <span class="chart-bar-val">${hadir}</span>
                <div class="chart-bar-fill" style="height: ${hadirHeight}%; background: linear-gradient(to top, rgba(16,185,129,0.2) 0%, var(--green) 100%); border: 1px solid rgba(16,185,129,0.3);"></div>
                <span class="chart-bar-label">Hadir</span>
            </div>
            <!-- Absen Column -->
            <div class="chart-bar-col">
                <span class="chart-bar-val">${tidakHadir}</span>
                <div class="chart-bar-fill" style="height: ${tidakHadirHeight}%; background: linear-gradient(to top, rgba(239,68,68,0.2) 0%, var(--red) 100%); border: 1px solid rgba(239,68,68,0.3);"></div>
                <span class="chart-bar-label">Absen</span>
            </div>
        `;
    }
}

// Bind to window object
window.AnalyticsPanel = AnalyticsPanel;
