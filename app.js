// Data storage
let dataPoints = [];
let segments = [];
let chart = null;
let manualCoolingStartIndex = null;

// Convert time string (HH:MM) to decimal hours
function timeToHours(timeStr) {
    const parts = timeStr.split(':');
    if (parts.length !== 2) return null;
    const hours = parseInt(parts[0]);
    const minutes = parseInt(parts[1]);
    if (isNaN(hours) || isNaN(minutes)) return null;
    return hours + minutes / 60;
}

// Convert decimal hours to time string (HH:MM)
function hoursToTime(hours) {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}:${m.toString().padStart(2, '0')}`;
}

// Add a data point
function addDataPoint() {
    const timestamp = document.getElementById('timestamp').value;
    const temperature = parseFloat(document.getElementById('temperature').value);

    if (!timestamp || isNaN(temperature)) {
        alert('Please enter both time and temperature');
        return;
    }

    const hours = timeToHours(timestamp);
    if (hours === null) {
        alert('Invalid time format. Use HH:MM (e.g., 14:30)');
        return;
    }

    dataPoints.push({ time: timestamp, hours: hours, temp: temperature });
    dataPoints.sort((a, b) => a.hours - b.hours);

    updateDataTable();
    updateChart();

    // Clear inputs
    document.getElementById('timestamp').value = '';
    document.getElementById('temperature').value = '';
}

// Delete a data point
function deleteDataPoint(index) {
    dataPoints.splice(index, 1);
    updateDataTable();
    updateChart();
}

// Update the data table display
function updateDataTable() {
    const tbody = document.getElementById('dataTableBody');
    tbody.innerHTML = '';

    dataPoints.forEach((point, index) => {
        const row = tbody.insertRow();
        row.insertCell(0).textContent = point.time;
        row.insertCell(1).textContent = point.temp.toFixed(1);
        const actionCell = row.insertCell(2);
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete';
        deleteBtn.className = 'delete';
        deleteBtn.onclick = () => deleteDataPoint(index);
        actionCell.appendChild(deleteBtn);
    });

    // Update cooling start point dropdown
    updateCoolingStartDropdown();

    // Update section height after table changes
    setTimeout(() => updateSectionHeight('dataPointsContent'), 0);
}

// Show bulk paste area
function showBulkPaste() {
    document.getElementById('bulkPasteArea').style.display = 'block';
    updateSectionHeight('dataPointsContent');
}

// Hide bulk paste area
function hideBulkPaste() {
    document.getElementById('bulkPasteArea').style.display = 'none';
    document.getElementById('bulkData').value = '';
    updateSectionHeight('dataPointsContent');
}

// Update section height after content changes
function updateSectionHeight(sectionId) {
    const section = document.getElementById(sectionId);
    if (section && !section.classList.contains('collapsed')) {
        section.style.maxHeight = section.scrollHeight + 'px';
    }
}

// Import bulk data from textarea
function importBulkData() {
    const bulkData = document.getElementById('bulkData').value;
    const lines = bulkData.split('\n');
    let importCount = 0;
    let errorCount = 0;

    for (let line of lines) {
        line = line.trim();
        if (!line) continue;

        // Try tab-separated first, then comma-separated, then space-separated
        let parts = line.split('\t');
        if (parts.length < 2) {
            parts = line.split(',');
        }
        if (parts.length < 2) {
            parts = line.split(/\s+/);
        }

        if (parts.length < 2) {
            errorCount++;
            continue;
        }

        const timestamp = parts[0].trim();
        const temperature = parseFloat(parts[1].trim());

        if (isNaN(temperature)) {
            errorCount++;
            continue;
        }

        const hours = timeToHours(timestamp);
        if (hours === null) {
            errorCount++;
            continue;
        }

        dataPoints.push({ time: timestamp, hours: hours, temp: temperature });
        importCount++;
    }

    dataPoints.sort((a, b) => a.hours - b.hours);

    if (importCount > 0) {
        updateDataTable();
        updateChart();
        hideBulkPaste();
        alert(`Imported ${importCount} data point(s)` + (errorCount > 0 ? `. ${errorCount} line(s) had errors and were skipped.` : ''));
    } else {
        alert('No valid data found. Please check the format.');
    }
}

// Clear all data points
function clearAllData() {
    if (dataPoints.length === 0) return;

    if (confirm('Are you sure you want to clear all data points?')) {
        dataPoints = [];
        manualCoolingStartIndex = null;
        updateDataTable();
        updateChart();
    }
}

// Update cooling start point dropdown
function updateCoolingStartDropdown() {
    const select = document.getElementById('coolingStartPoint');

    // Save current selection
    const currentValue = select.value;

    // Clear existing options except auto
    select.innerHTML = '<option value="auto">Auto-detect (peak temperature)</option>';

    // Add option for each data point
    dataPoints.forEach((point, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = `${point.time} (${point.temp.toFixed(1)}°C)`;
        select.appendChild(option);
    });

    // Restore selection if possible
    if (currentValue !== 'auto' && parseInt(currentValue) < dataPoints.length) {
        select.value = currentValue;
    } else {
        select.value = 'auto';
        manualCoolingStartIndex = null;
    }

    // Update section height after dropdown changes
    setTimeout(() => updateSectionHeight('coolingContent'), 0);
}

// Handle cooling start point change
function onCoolingStartChanged() {
    const select = document.getElementById('coolingStartPoint');
    if (select.value === 'auto') {
        manualCoolingStartIndex = null;
    } else {
        manualCoolingStartIndex = parseInt(select.value);
    }
    updateChart();
}

// Handle auto-fit checkbox change
function onAutoFitChanged() {
    updateChart();
}

// Add a heating segment
function addSegment() {
    const heatingSpeed = parseFloat(document.getElementById('heatingSpeed').value);
    const stopTemp = parseFloat(document.getElementById('stopTemp').value);
    const holdTime = document.getElementById('holdTime').value;

    if (isNaN(heatingSpeed) || isNaN(stopTemp) || !holdTime) {
        alert('Please fill in all segment fields');
        return;
    }

    segments.push({ heatingSpeed, stopTemp, holdTime });
    updateSegmentTable();

    // Clear inputs
    document.getElementById('heatingSpeed').value = '';
    document.getElementById('stopTemp').value = '';
    document.getElementById('holdTime').value = '';
}

// Delete a segment
function deleteSegment(index) {
    segments.splice(index, 1);
    updateSegmentTable();
}

// Update the segment table display
function updateSegmentTable() {
    const tbody = document.getElementById('segmentTableBody');
    tbody.innerHTML = '';

    segments.forEach((segment, index) => {
        const row = tbody.insertRow();
        row.insertCell(0).textContent = segment.heatingSpeed;
        row.insertCell(1).textContent = segment.stopTemp;
        row.insertCell(2).textContent = segment.holdTime;
        const actionCell = row.insertCell(3);
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete';
        deleteBtn.className = 'delete';
        deleteBtn.onclick = () => deleteSegment(index);
        actionCell.appendChild(deleteBtn);
    });

    // Update section height after table changes
    setTimeout(() => updateSectionHeight('segmentsContent'), 0);
}

// Calculate exponential decay for cooling
// Model: T(t) = T_ambient + (T_start - T_ambient) * e^(-k * t)
// where k is the decay rate
function calculateCoolingCurve(startTime, startTemp, ambientTemp, decayRate, hours) {
    const points = [];
    const stepMinutes = 5; // Calculate every 5 minutes
    const steps = Math.ceil(hours * 60 / stepMinutes);

    for (let i = 0; i <= steps; i++) {
        const elapsedHours = (i * stepMinutes) / 60;
        const temp = ambientTemp + (startTemp - ambientTemp) * Math.exp(-decayRate * elapsedHours);
        const time = startTime + elapsedHours;
        points.push({ hours: time, temp: temp });
    }

    return points;
}

// Calculate error for a given decay rate
function calculateDecayError(rate, coolingPoints, ambientTemp) {
    const t0 = coolingPoints[0].hours;
    const T0 = coolingPoints[0].temp;

    let error = 0;
    for (let point of coolingPoints) {
        const dt = point.hours - t0;
        const predicted = ambientTemp + (T0 - ambientTemp) * Math.exp(-rate * dt);
        error += Math.pow(predicted - point.temp, 2);
    }

    return error;
}

// Fit exponential decay to cooling data points using ternary search
// Returns the best-fit decay rate using least squares with high precision
function fitCoolingModel(coolingPoints, ambientTemp) {
    if (coolingPoints.length < 2) return 0.5; // Default value

    // Use ternary search to find the optimal decay rate
    // This works because the error function is unimodal (has one minimum)
    let left = 0.01;   // Minimum possible decay rate
    let right = 5.0;   // Maximum reasonable decay rate
    const epsilon = 1e-6; // Precision target

    // Ternary search for minimum error
    while (right - left > epsilon) {
        const mid1 = left + (right - left) / 3;
        const mid2 = right - (right - left) / 3;

        const error1 = calculateDecayError(mid1, coolingPoints, ambientTemp);
        const error2 = calculateDecayError(mid2, coolingPoints, ambientTemp);

        if (error1 > error2) {
            left = mid1;
        } else {
            right = mid2;
        }
    }

    return (left + right) / 2;
}

// Identify cooling phase (when temperature starts decreasing)
function identifyCoolingPhase() {
    if (dataPoints.length < 2) return null;

    // If manual cooling start is set, use it
    if (manualCoolingStartIndex !== null && manualCoolingStartIndex < dataPoints.length) {
        return dataPoints.slice(manualCoolingStartIndex);
    }

    // Auto-detect: Find the peak temperature (start of cooling)
    let peakIndex = 0;
    let peakTemp = dataPoints[0].temp;

    for (let i = 1; i < dataPoints.length; i++) {
        if (dataPoints[i].temp > peakTemp) {
            peakTemp = dataPoints[i].temp;
            peakIndex = i;
        }
    }

    // Return all points from peak onwards (these are cooling points)
    return dataPoints.slice(peakIndex);
}

// Update the chart
function updateChart() {
    const ctx = document.getElementById('temperatureChart').getContext('2d');

    // Get parameters
    const ambientTemp = parseFloat(document.getElementById('ambientTemp').value);
    const decayRate = parseFloat(document.getElementById('decayRate').value);
    const extrapolateHours = parseFloat(document.getElementById('extrapolateHours').value);

    // Prepare datasets
    const datasets = [];

    // Actual data points
    if (dataPoints.length > 0) {
        datasets.push({
            label: 'Actual Temperature',
            data: dataPoints.map(p => ({ x: p.hours, y: p.temp })),
            borderColor: 'rgb(75, 192, 192)',
            backgroundColor: 'rgba(75, 192, 192, 0.5)',
            pointRadius: 6,
            pointHoverRadius: 8,
            showLine: true,
            tension: 0
        });

        // Cooling model extrapolation
        const coolingPoints = identifyCoolingPhase();
        if (coolingPoints && coolingPoints.length > 0) {
            const startPoint = coolingPoints[0];

            // Auto-fit decay rate if checkbox is checked and we have enough cooling data
            let effectiveDecayRate = decayRate;
            const autoFit = document.getElementById('autoFitDecay').checked;
            if (autoFit && coolingPoints.length >= 3) {
                effectiveDecayRate = fitCoolingModel(coolingPoints, ambientTemp);
                // Update the UI with the fitted value
                document.getElementById('decayRate').value = effectiveDecayRate.toFixed(3);
            }

            const coolingCurve = calculateCoolingCurve(
                startPoint.hours,
                startPoint.temp,
                ambientTemp,
                effectiveDecayRate,
                extrapolateHours
            );

            datasets.push({
                label: 'Cooling Model (Exponential Decay)',
                data: coolingCurve.map(p => ({ x: p.hours, y: p.temp })),
                borderColor: 'rgb(255, 99, 132)',
                backgroundColor: 'rgba(255, 99, 132, 0.1)',
                borderDash: [5, 5],
                pointRadius: 0,
                showLine: true,
                tension: 0.1
            });
        }
    }

    // Destroy existing chart
    if (chart) {
        chart.destroy();
    }

    // Calculate axis ranges
    let minHours = 0;
    let maxHours = 24;
    let minTemp = 0;
    let maxTemp = 1200;

    if (dataPoints.length > 0) {
        minHours = Math.floor(Math.min(...dataPoints.map(p => p.hours)));
        maxHours = Math.ceil(Math.max(...dataPoints.map(p => p.hours)) + extrapolateHours);
        minTemp = Math.floor(Math.min(...dataPoints.map(p => p.temp), ambientTemp) / 50) * 50;
        maxTemp = Math.ceil(Math.max(...dataPoints.map(p => p.temp)) / 100) * 100;
    }

    // Create new chart
    chart = new Chart(ctx, {
        type: 'scatter',
        data: { datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Kiln Temperature Over Time',
                    font: { size: 16 }
                },
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const time = hoursToTime(context.parsed.x);
                            const temp = context.parsed.y.toFixed(1);
                            return `${context.dataset.label}: ${time} - ${temp}°C`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    type: 'linear',
                    position: 'bottom',
                    title: {
                        display: true,
                        text: 'Time (hours)',
                        font: { size: 14 }
                    },
                    min: minHours,
                    max: maxHours,
                    ticks: {
                        stepSize: 1,
                        callback: function(value) {
                            return hoursToTime(value);
                        }
                    },
                    grid: {
                        display: true,
                        color: function(context) {
                            // Darker grid lines every hour
                            if (context.tick.value % 1 === 0) {
                                return 'rgba(0, 0, 0, 0.2)';
                            }
                            return 'rgba(0, 0, 0, 0.05)';
                        },
                        lineWidth: function(context) {
                            if (context.tick.value % 1 === 0) {
                                return 1;
                            }
                            return 0.5;
                        }
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Temperature (°C)',
                        font: { size: 14 }
                    },
                    min: minTemp,
                    max: maxTemp,
                    ticks: {
                        stepSize: 50,
                        callback: function(value) {
                            return value + '°C';
                        }
                    },
                    grid: {
                        display: true,
                        color: function(context) {
                            // Darker grid lines every 100°C
                            if (context.tick.value % 100 === 0) {
                                return 'rgba(0, 0, 0, 0.2)';
                            }
                            return 'rgba(0, 0, 0, 0.05)';
                        },
                        lineWidth: function(context) {
                            if (context.tick.value % 100 === 0) {
                                return 1;
                            }
                            return 0.5;
                        }
                    }
                }
            }
        }
    });
}

// Toggle section collapse/expand
function toggleSection(sectionId) {
    const section = document.getElementById(sectionId);
    const btn = document.getElementById(sectionId + '-btn');

    if (section.classList.contains('collapsed')) {
        section.classList.remove('collapsed');
        section.style.maxHeight = section.scrollHeight + 'px';
        btn.textContent = '[Collapse]';
    } else {
        section.style.maxHeight = section.scrollHeight + 'px';
        // Force reflow
        section.offsetHeight;
        section.classList.add('collapsed');
        btn.textContent = '[Expand]';
    }
}

// Initialize section heights and chart on page load
document.addEventListener('DOMContentLoaded', function() {
    // Set initial max-height for all section-content divs
    const sections = document.querySelectorAll('.section-content');
    sections.forEach(section => {
        section.style.maxHeight = section.scrollHeight + 'px';
    });

    updateChart();
});
