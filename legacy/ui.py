import sys
import os
import networkx as nx
import matplotlib
import matplotlib.pyplot as plt
import csv
from datetime import datetime

# Ensure using PyQt5 backend for Matplotlib
matplotlib.use('Qt5Agg')
from matplotlib.backends.backend_qt5agg import FigureCanvasQTAgg as FigureCanvas
from matplotlib.figure import Figure

from PyQt5.QtWidgets import (QMainWindow, QPushButton, QVBoxLayout, QHBoxLayout,
                             QWidget, QMessageBox, QInputDialog, QLabel,
                             QFrame, QTextEdit, QFileDialog, QGroupBox,
                             QLineEdit, QProgressBar, QScrollArea, QSizePolicy,
                             QComboBox, QSpinBox, QGraphicsDropShadowEffect, QApplication)
from PyQt5.QtCore import Qt, QTimer, QPropertyAnimation, QEasingCurve, QRect, QSize
from PyQt5.QtGui import QFont, QColor, QPainter, QBrush, QPen, QLinearGradient, QPalette, QIcon

# =============================================================================
# 1. BACKEND IMPORT & MOCK FALLBACK
# =============================================================================
try:
    from graph_manager import GraphManager
    from scenario_generator import ScenarioGenerator
    from web_exporter import WebExporter
    BACKEND_LOADED = True
except ImportError:
    BACKEND_LOADED = False
    print("WARNING: graph_manager.py not found. Running in UI DEMO MODE.")

    # Mock Classes for UI Testing
    class GraphManager:
        def __init__(self):
            self.graph = nx.DiGraph()
            self.graph.add_node("P1"); self.graph.add_node("R1")
            self.graph.add_edge("R1", "P1") # Allocation
            self.scheduler_mode = "FCFS"
            self.running_queue = ["P1"]
            self.ready_queue = ["P2", "P3"]
            self.blocked_queue = ["P4"]
            self.process_info = {"P1": {"remaining": 5, "burst": 10}, "P2": {"remaining": 8, "burst": 8}}
            self.resource_instances = {"R1": {"available": 1, "total": 3}}
            self.global_tick_counter = 10
            self.allocations = {}
            self.file_descriptor_table = {}

        def tick(self): self.global_tick_counter += 1
        def get_resource_utilization(self): return {"R1": 66, "R2": 30}
        def get_gantt_data(self): return {"P1": [{"start": 0, "end": 5, "state": "running"}]}
        def get_memory_stats(self): return {"total_memory_mb": 1024, "used_memory_mb": 256, "free_memory_mb": 768, "utilization_percent": 25, "total_page_faults": 2, "swapped_processes": 0}
        def get_syscall_stats(self): return {"total_syscalls": 12, "by_type": {"open": 5, "read": 7}}
        def add_process(self, b, priority=0, nice=0, memory_mb=0): return "P_NEW"
        def add_resource(self, q): return "R_NEW"
        def allocate_resource(self, p, r): return "success", "Allocated"
        def release_resource(self, r, p): return True, "Released"
        def get_deadlock_cycle(self): return None
        def create_snapshot(self): pass
        def restore_snapshot(self): return True
        def set_scheduler(self, m, q): self.scheduler_mode = m
        def get_statistics(self): return {"total_processes": 5, "completed": 1, "running": 1, "ready": 2, "blocked": 1, "context_switches": 5, "avg_turnaround_time": 4.5, "avg_waiting_time": 2.2, "avg_response_time": 1.1, "cpu_utilization": 88}
        def get_blocked_processes(self): return {}
        def clear_timeline(self): pass

    class ScenarioGenerator:
        @staticmethod
        def get_all_scenarios(): return [("demo", "Demo Scenario", "A test scenario")]
        @staticmethod
        def load_scenario(gm, key): return None

# =============================================================================
# 2. DESIGN SYSTEM (COLORS & STYLES)
# =============================================================================

THEMES = {
    "Neubrutalism": {
        "bg": "#fef9ef",
        "panel": "#ffffff",
        "panel_highlight": "#fef3c7",
        "panel_elevated": "#fde68a",
        "accent_primary": "#000000",
        "accent_secondary": "#3b82f6",
        "accent_tertiary": "#8b5cf6",
        "success": "#10b981",
        "warning": "#f59e0b",
        "danger": "#ef4444",
        "text_main": "#000000",
        "text_dim": "#1f2937",
        "text_dimmer": "#4b5563",
        "text_faded": "#6b7280",
        "border": "#000000",
        "border_light": "#000000",
        "shadow": "#000000"
    },
    "Light": {
        "bg": "#f8f9fa",
        "panel": "#ffffff",
        "panel_highlight": "#f1f3f5",
        "panel_elevated": "#e9ecef",
        "accent_primary": "#4c6ef5",
        "accent_secondary": "#5c7cfa",
        "accent_tertiary": "#7950f2",
        "success": "#37b24d",
        "warning": "#f59f00",
        "danger": "#f03e3e",
        "text_main": "#212529",
        "text_dim": "#495057",
        "text_dimmer": "#868e96",
        "text_faded": "#adb5bd",
        "border": "#dee2e6",
        "border_light": "#e9ecef"
    },
    "Dark": {
        "bg": "#0d0d12",
        "panel": "#16161d",
        "panel_highlight": "#1e1e28",
        "panel_elevated": "#252532",
        "accent_primary": "#5b67ea",
        "accent_secondary": "#3b82f6",
        "accent_tertiary": "#7c3aed",
        "success": "#10b981",
        "warning": "#f59e0b",
        "danger": "#ef4444",
        "text_main": "#f1f5f9",
        "text_dim": "#cbd5e1",
        "text_dimmer": "#94a3b8",
        "text_faded": "#64748b",
        "border": "#2d3748",
        "border_light": "#334155"
    },
    "Ocean": {
        "bg": "#f0f9ff",
        "panel": "#ffffff",
        "panel_highlight": "#e0f2fe",
        "panel_elevated": "#bae6fd",
        "accent_primary": "#0284c7",
        "accent_secondary": "#0ea5e9",
        "accent_tertiary": "#06b6d4",
        "success": "#059669",
        "warning": "#d97706",
        "danger": "#dc2626",
        "text_main": "#0c4a6e",
        "text_dim": "#075985",
        "text_dimmer": "#0369a1",
        "text_faded": "#38bdf8",
        "border": "#bae6fd",
        "border_light": "#e0f2fe"
    },
    "Forest": {
        "bg": "#f0fdf4",
        "panel": "#ffffff",
        "panel_highlight": "#dcfce7",
        "panel_elevated": "#bbf7d0",
        "accent_primary": "#16a34a",
        "accent_secondary": "#22c55e",
        "accent_tertiary": "#84cc16",
        "success": "#16a34a",
        "warning": "#ca8a04",
        "danger": "#dc2626",
        "text_main": "#14532d",
        "text_dim": "#166534",
        "text_dimmer": "#15803d",
        "text_faded": "#4ade80",
        "border": "#bbf7d0",
        "border_light": "#dcfce7"
    }
}

COLORS = THEMES["Neubrutalism"]

STYLESHEET = f"""
QMainWindow {{ background-color: {COLORS['bg']}; }}
QWidget {{ font-family: 'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', sans-serif; color: {COLORS['text_main']}; font-size: 13px; }}

/* --- SCROLL BARS --- */
QScrollBar:vertical {{ border: 3px solid {COLORS['border']}; background: {COLORS['panel']}; width: 14px; margin: 0px; }}
QScrollBar::handle:vertical {{ background: {COLORS['accent_primary']}; min-height: 20px; border-radius: 0px; }}
QScrollBar::handle:vertical:hover {{ background: {COLORS['accent_secondary']}; }}
QScrollBar::add-line:vertical, QScrollBar::sub-line:vertical {{ height: 0px; }}
QScrollBar:horizontal {{ border: 3px solid {COLORS['border']}; background: {COLORS['panel']}; height: 14px; }}
QScrollBar::handle:horizontal {{ background: {COLORS['accent_primary']}; min-width: 20px; border-radius: 0px; }}
QScrollBar::handle:horizontal:hover {{ background: {COLORS['accent_secondary']}; }}
QScrollBar::add-line:horizontal, QScrollBar::sub-line:horizontal {{ width: 0px; }}

/* --- PANELS & FRAMES --- */
QFrame#Card {{
    background-color: {COLORS['panel']};
    border: 4px solid {COLORS['border']};
    border-radius: 0px;
}}
QFrame#SidePanel {{
    background-color: {COLORS['panel']};
    border-right: 4px solid {COLORS['border']};
}}
QFrame#TimelinePanel {{
    background-color: {COLORS['panel']};
    border: 4px solid {COLORS['border']};
    border-radius: 0px;
}}

/* --- BUTTONS --- */
QPushButton {{
    background-color: {COLORS['panel']};
    border: 3px solid {COLORS['border']};
    border-radius: 0px;
    padding: 11px 16px;
    color: {COLORS['text_main']};
    font-weight: 700;
    text-align: left;
    font-size: 13px;
}}
QPushButton:hover {{
    background-color: {COLORS['panel_highlight']};
}}
QPushButton:pressed {{
    background-color: {COLORS['panel_elevated']};
}}

/* Special Buttons */
QPushButton#PrimaryAction {{
    background-color: {COLORS['accent_primary']};
    color: white;
    border: 3px solid {COLORS['border']};
    font-weight: 700;
}}
QPushButton#PrimaryAction:hover {{
    background-color: {COLORS['accent_secondary']};
}}
QPushButton#DangerAction {{
    background-color: {COLORS['danger']};
    color: white;
    border: 3px solid {COLORS['border']};
    font-weight: 700;
}}
QPushButton#SuccessAction {{
    background-color: {COLORS['success']};
    color: white;
    border: 3px solid {COLORS['border']};
    font-weight: 700;
}}
QPushButton#IconButton {{
    background-color: {COLORS['panel']};
    border: 3px solid {COLORS['border']};
    border-radius: 0px;
    padding: 12px;
    min-width: 48px;
    max-width: 48px;
    min-height: 48px;
    max-height: 48px;
}}
QPushButton#IconButton:hover {{
    background-color: {COLORS['accent_primary']};
    color: white;
}}

/* --- INPUTS --- */
QLineEdit, QComboBox, QSpinBox {{
    background-color: {COLORS['panel']};
    border: 3px solid {COLORS['border']};
    border-radius: 0px;
    padding: 10px;
    color: {COLORS['text_main']};
    font-family: 'Consolas', monospace;
    font-weight: 600;
}}
QLineEdit:focus, QComboBox:focus, QSpinBox:focus {{
    border: 3px solid {COLORS['accent_primary']};
    background-color: {COLORS['panel_highlight']};
}}
QComboBox::drop-down {{
    border: none;
    padding-right: 8px;
}}
QComboBox QAbstractItemView {{
    background-color: {COLORS['panel']};
    color: {COLORS['text_main']};
    border: 3px solid {COLORS['border']};
    selection-background-color: {COLORS['accent_primary']};
    selection-color: white;
    padding: 4px;
}}

/* --- GROUP BOX --- */
QGroupBox {{
    border: 3px solid {COLORS['border']};
    border-radius: 0px;
    margin-top: 1.5em;
    padding: 18px 12px 12px 12px;
    font-weight: bold;
    color: {COLORS['text_dim']};
    background-color: {COLORS['panel']};
}}
QGroupBox::title {{ subcontrol-origin: margin; left: 12px; padding: 0 8px; }}

/* --- TERMINAL --- */
QTextEdit {{
    background-color: {COLORS['panel']};
    border: 3px solid {COLORS['border']};
    border-radius: 0px;
    color: {COLORS['text_main']};
    font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
    font-size: 12px;
    selection-background-color: {COLORS['accent_primary']};
    padding: 8px;
}}

/* --- SLIDER --- */
QSlider::groove:horizontal {{
    border: 3px solid {COLORS['border']};
    height: 8px;
    background: {COLORS['panel']};
    border-radius: 0px;
}}
QSlider::handle:horizontal {{
    background: {COLORS['accent_primary']};
    border: 3px solid {COLORS['border']};
    width: 20px;
    height: 20px;
    margin: -8px 0;
    border-radius: 0px;
}}
QSlider::handle:horizontal:hover {{
    background: {COLORS['accent_secondary']};
}}
"""

# =============================================================================
# 3. CUSTOM WIDGETS
# =============================================================================

class ModernCard(QFrame):
    """A container with neubrutalism hard shadow and sharp edges."""
    def __init__(self, parent=None, animate=True):
        super().__init__(parent)
        self.setObjectName("Card")

        # Neubrutalism hard shadow effect
        shadow = QGraphicsDropShadowEffect(self)
        shadow.setBlurRadius(0)
        shadow.setColor(QColor(0, 0, 0, 255))
        shadow.setOffset(6, 6)
        self.setGraphicsEffect(shadow)

        # Entrance animation
        if animate:
            self.setWindowOpacity(0)
            QTimer.singleShot(50, self.animate_entrance)

    def animate_entrance(self):
        """Smooth fade-in animation"""
        self.anim = QPropertyAnimation(self, b"windowOpacity")
        self.anim.setDuration(400)
        self.anim.setStartValue(0)
        self.anim.setEndValue(1)
        self.anim.setEasingCurve(QEasingCurve.OutCubic)
        self.anim.start()

class MplCanvas(FigureCanvas):
    def __init__(self, parent=None, width=5, height=4, dpi=100):
        # Configure plotting theme
        plt.rcParams['text.color'] = COLORS['text_main']
        plt.rcParams['axes.labelcolor'] = COLORS['text_main']
        plt.rcParams['xtick.color'] = COLORS['text_dim']
        plt.rcParams['ytick.color'] = COLORS['text_dim']

        self.fig = Figure(figsize=(width, height), dpi=dpi)
        self.axes = self.fig.add_subplot(111)

        # Match the light theme
        self.fig.patch.set_facecolor(COLORS['panel'])
        self.axes.set_facecolor(COLORS['panel'])
        self.axes.axis('off')

        self.fig.subplots_adjust(left=0, right=1, top=1, bottom=0)
        super(MplCanvas, self).__init__(self.fig)
        self.setSizePolicy(QSizePolicy.Expanding, QSizePolicy.Expanding)

class QueueVisualizer(QWidget):
    def __init__(self, parent=None):
        super().__init__(parent)
        self.running = None
        self.ready_queue = []
        self.blocked_queue = []
        self.procs_info = {}
        self.setMinimumHeight(200)
        self.anim_offset = 0.0

        self.timer = QTimer(self)
        self.timer.timeout.connect(self.animate)
        self.timer.start(30)

    def animate(self):
        self.anim_offset += 0.05
        if self.anim_offset > 1.0: self.anim_offset = 0
        if self.running: self.update()

    def update_data(self, running, ready, blocked, info):
        self.running = running[0] if running else None
        self.ready_queue = ready
        self.blocked_queue = blocked
        self.procs_info = info
        self.update()

    def paintEvent(self, event):
        painter = QPainter(self)

        # Background sections with bold borders and rounded corners
        painter.setPen(QPen(QColor(COLORS['border']), 4))
        painter.setBrush(QColor(COLORS['panel']))
        painter.drawRoundedRect(8, 10, self.width() - 16, 50, 8, 8)
        painter.drawRoundedRect(8, 70, self.width() - 16, 50, 8, 8)
        painter.drawRoundedRect(8, 130, self.width() - 16, 50, 8, 8)

        # Labels - vertically centered
        self.draw_label(painter, 18, 35, "CPU", COLORS['success'])
        self.draw_label(painter, 18, 95, "READY", COLORS['accent_secondary'])
        self.draw_label(painter, 18, 155, "BLOCKED", COLORS['danger'])

        # Draw Running - vertically centered
        if self.running:
            self.draw_process_capsule(painter, 110, 15, self.running, COLORS['success'], True)
        else:
            self.draw_placeholder(painter, 110, 15, "IDLE")

        # Draw Ready Queue - vertically centered
        x_off = 110
        if not self.ready_queue:
             self.draw_placeholder(painter, 110, 75, "EMPTY")
        else:
            count = 0
            max_display = 4
            for pid in self.ready_queue:
                if pid == self.running: continue
                if count >= max_display:
                    self.draw_ellipsis(painter, x_off, 75)
                    break
                w = self.draw_process_capsule(painter, x_off, 75, pid, COLORS['accent_primary'], False)
                x_off += w + 10
                count += 1

        # Draw Blocked Queue - vertically centered
        x_off = 110
        if not self.blocked_queue:
             self.draw_placeholder(painter, 110, 135, "NONE")
        else:
            count = 0
            max_display = 4
            for pid in self.blocked_queue:
                if count >= max_display:
                    self.draw_ellipsis(painter, x_off, 135)
                    break
                w = self.draw_process_capsule(painter, x_off, 135, pid, COLORS['danger'], False)
                x_off += w + 10
                count += 1

    def draw_label(self, painter, x, y, text, color):
        painter.setPen(QColor(COLORS['text_main']))
        painter.setFont(QFont("Inter", 11, QFont.Black))
        painter.drawText(x, y, text)

    def draw_placeholder(self, painter, x, y, text):
        painter.setPen(QPen(QColor(COLORS['border']), 3, Qt.DashLine))
        painter.setBrush(QColor(COLORS['panel']))
        painter.drawRect(x, y, 86, 36)
        painter.setPen(QColor(COLORS['text_dimmer']))
        painter.setFont(QFont("Segoe UI", 10, QFont.Bold))
        painter.drawText(QRect(x, y, 86, 36), Qt.AlignCenter, text)

    def draw_process_capsule(self, painter, x, y, pid, base_color, is_active):
        info = self.procs_info.get(pid, {'remaining':0, 'burst':1})
        progress = 1.0 - (info['remaining'] / max(1, info['burst']))
        text = f"{pid}"
        w, h = 86, 36

        # Flat color background - neubrutalism
        c = QColor(base_color)
        painter.setBrush(c)
        painter.setPen(QPen(QColor(COLORS['border']), 3))
        painter.drawRect(x, y, w, h)

        # Progress Indicator (Bold bar at bottom)
        if progress > 0:
            painter.setPen(Qt.NoPen)
            painter.setBrush(QColor(0, 0, 0, 100))
            painter.drawRect(x+5, y+h-8, w-10, 5)
            painter.setBrush(QColor("white"))
            painter.drawRect(x+5, y+h-8, int((w-10) * progress), 5)

        # Text
        painter.setPen(QColor("white"))
        painter.setFont(QFont("Segoe UI", 11, QFont.Bold))
        painter.drawText(QRect(x, y, w, h-8), Qt.AlignCenter, text)
        return w

    def draw_ellipsis(self, painter, x, y):
        painter.setPen(QColor(COLORS['text_main']))
        painter.setFont(QFont("Inter", 20, QFont.Black))
        painter.drawText(x, y + 28, "...")

class GanttChartWidget(QWidget):
    def __init__(self, parent=None):
        super().__init__(parent)
        self.gantt_data = {}
        self.max_tick = 0
        self.setMinimumHeight(150)

    def update_data(self, gantt_data, current_tick):
        self.gantt_data = gantt_data
        self.max_tick = max(current_tick, 1)
        self.update()

    def paintEvent(self, event):
        painter = QPainter(self)
        painter.setRenderHint(QPainter.Antialiasing)
        painter.fillRect(self.rect(), QColor(COLORS['panel']))

        if not self.gantt_data:
            painter.setPen(QColor(COLORS['text_dim']))
            painter.setFont(QFont("Segoe UI", 11))
            painter.drawText(self.rect(), Qt.AlignCenter, "No process execution history yet\nStart the simulation to see the Gantt chart")
            return

        margin_left, margin_top = 80, 40
        row_height, row_spacing = 30, 8
        width = self.width() - margin_left - 30

        # Time Axis with labels
        time_scale = width / max(self.max_tick, 1)
        painter.setPen(QColor(COLORS['border']))
        painter.setFont(QFont("Segoe UI", 8))
        for t in range(0, self.max_tick + 1, max(1, self.max_tick // 10)):
            x = margin_left + t * time_scale
            painter.drawLine(int(x), margin_top, int(x), self.height() - 10)
            painter.setPen(QColor(COLORS['text_dimmer']))
            painter.drawText(int(x) - 10, margin_top - 5, f"{t}")
            painter.setPen(QColor(COLORS['border']))

        # Time axis label
        painter.setPen(QColor(COLORS['text_dim']))
        painter.setFont(QFont("Segoe UI", 9))
        painter.drawText(margin_left, margin_top - 20, "Time (ticks) →")

        y = margin_top + 10
        for pid, entries in sorted(self.gantt_data.items()):
            # Process label
            painter.setPen(QColor(COLORS['text_main']))
            painter.setFont(QFont("Segoe UI", 10, QFont.Bold))
            painter.drawText(5, y + 20, pid)

            for entry in entries:
                start, end = entry['start'], entry['end']
                x1 = margin_left + start * time_scale
                x2 = margin_left + end * time_scale
                w_bar = max(x2 - x1, 3)

                # Different colors for different states
                if entry['state'] == 'running':
                    color = COLORS['success']
                    border_color = COLORS['success']
                elif entry['state'] == 'blocked':
                    color = COLORS['danger']
                    border_color = COLORS['danger']
                else:
                    color = COLORS['accent_secondary']
                    border_color = COLORS['accent_primary']

                painter.setBrush(QColor(color))
                painter.setPen(QPen(QColor(border_color), 1))
                painter.drawRoundedRect(int(x1), y, int(w_bar), row_height, 4, 4)

                # Add time labels on bars if wide enough
                if w_bar > 30:
                    painter.setPen(QColor("white"))
                    painter.setFont(QFont("Segoe UI", 7))
                    painter.drawText(int(x1) + 2, y + 18, f"{start}-{end}")

            y += row_height + row_spacing

        # Legend
        legend_y = self.height() - 25
        painter.setFont(QFont("Segoe UI", 8))

        painter.setBrush(QColor(COLORS['success']))
        painter.setPen(Qt.NoPen)
        painter.drawRoundedRect(10, legend_y, 15, 15, 3, 3)
        painter.setPen(QColor(COLORS['text_dim']))
        painter.drawText(30, legend_y + 12, "Running")

        painter.setBrush(QColor(COLORS['accent_secondary']))
        painter.setPen(Qt.NoPen)
        painter.drawRoundedRect(100, legend_y, 15, 15, 3, 3)
        painter.setPen(QColor(COLORS['text_dim']))
        painter.drawText(120, legend_y + 12, "Ready")

        painter.setBrush(QColor(COLORS['danger']))
        painter.setPen(Qt.NoPen)
        painter.drawRoundedRect(180, legend_y, 15, 15, 3, 3)
        painter.setPen(QColor(COLORS['text_dim']))
        painter.drawText(200, legend_y + 12, "Blocked")

class ResourceMonitorWidget(QWidget):
    def __init__(self, parent=None):
        super().__init__(parent)
        self.layout = QVBoxLayout(self)
        self.layout.setContentsMargins(0, 0, 0, 0)
        self.layout.setSpacing(8)
        self.bars = {}
        self.graph_manager = None
        self.layout.addStretch()

    def set_graph_manager(self, gm):
        self.graph_manager = gm

    def update_stats(self, stats):
        # Clear old bars if resources changed
        if self.graph_manager:
            current_resources = set(self.graph_manager.resource_instances.keys())
            old_resources = set(self.bars.keys())

            # Remove bars for deleted resources
            for rid in old_resources - current_resources:
                if rid in self.bars:
                    self.bars[rid]['container'].setParent(None)
                    del self.bars[rid]

        # Update or create bars for current resources
        if self.graph_manager:
            for rid, res_info in self.graph_manager.resource_instances.items():
                available = res_info.get('available', 0)
                total = res_info.get('total', 1)
                percent = (available / total * 100) if total > 0 else 0

                if rid not in self.bars:
                    self.create_bar(rid)

                self.bars[rid]['progress'].setValue(int(percent))
                self.bars[rid]['value'].setText(f"{available}/{total}")
                self.bars[rid]['percent'].setText(f"{int(percent)}%")

                # Color based on availability
                if percent < 25:
                    color = COLORS['danger']
                elif percent < 50:
                    color = COLORS['warning']
                else:
                    color = COLORS['success']

                self.bars[rid]['progress'].setStyleSheet(f"""
                    QProgressBar {{
                        background: {COLORS['panel_highlight']};
                        border: 1px solid {COLORS['border']};
                        border-radius: 4px;
                    }}
                    QProgressBar::chunk {{
                        background: {color};
                        border-radius: 3px;
                    }}
                """)

    def create_bar(self, rid):
        container = QWidget()
        container.setStyleSheet(f"""
            QWidget {{
                background: {COLORS['panel_highlight']};
                border: 1px solid {COLORS['border']};
                border-radius: 8px;
                padding: 8px;
            }}
        """)
        l = QVBoxLayout(container)
        l.setContentsMargins(8, 8, 8, 8)
        l.setSpacing(4)

        top = QHBoxLayout()
        lbl = QLabel(rid)
        lbl.setStyleSheet(f"color: {COLORS['text_main']}; font-weight: bold; font-size: 12px;")
        val = QLabel("0/0")
        val.setStyleSheet(f"color: {COLORS['text_dim']}; font-size: 11px;")
        top.addWidget(lbl)
        top.addStretch()
        top.addWidget(val)

        pbar = QProgressBar()
        pbar.setFixedHeight(8)
        pbar.setTextVisible(False)
        pbar.setStyleSheet(f"""
            QProgressBar {{
                background: {COLORS['panel_highlight']};
                border: 1px solid {COLORS['border']};
                border-radius: 4px;
            }}
            QProgressBar::chunk {{
                background: {COLORS['accent_primary']};
                border-radius: 3px;
            }}
        """)

        percent_lbl = QLabel("0%")
        percent_lbl.setStyleSheet(f"color: {COLORS['text_dimmer']}; font-size: 10px;")
        percent_lbl.setAlignment(Qt.AlignRight)

        l.addLayout(top)
        l.addWidget(pbar)
        l.addWidget(percent_lbl)

        self.bars[rid] = {
            'container': container,
            'progress': pbar,
            'value': val,
            'percent': percent_lbl
        }
        self.layout.addWidget(container)


class MemoryStatusWidget(QWidget):
    """Memory status display with big bold typography"""
    def __init__(self, parent=None):
        super().__init__(parent)
        main_layout = QVBoxLayout(self)
        main_layout.setContentsMargins(20, 20, 20, 20)
        main_layout.setSpacing(8)

        # Big percentage display
        self.util_percent = QLabel("0%")
        self.util_percent.setStyleSheet(f"color: {COLORS['text_main']}; font-size: 56px; font-weight: 900; line-height: 1;")
        self.util_percent.setAlignment(Qt.AlignCenter)
        main_layout.addWidget(self.util_percent)

        # Label below
        util_label = QLabel("MEMORY UTILIZATION")
        util_label.setStyleSheet(f"color: {COLORS['text_main']}; font-size: 10px; font-weight: 900; letter-spacing: 2px;")
        util_label.setAlignment(Qt.AlignCenter)
        main_layout.addWidget(util_label)

        # Usage info
        self.usage_value = QLabel("0 / 0 MB")
        self.usage_value.setStyleSheet(f"color: {COLORS['text_main']}; font-size: 11px; font-weight: 700;")
        self.usage_value.setAlignment(Qt.AlignCenter)
        main_layout.addWidget(self.usage_value)

        main_layout.addSpacing(8)

        # Page faults
        pf_container = QHBoxLayout()
        pf_container.setSpacing(10)
        pf_container.addStretch()

        pf_label = QLabel("PAGE FAULTS:")
        pf_label.setStyleSheet(f"color: {COLORS['text_main']}; font-size: 11px; font-weight: 900;")
        pf_container.addWidget(pf_label)

        self.pf_value = QLabel("0")
        self.pf_value.setStyleSheet(f"color: {COLORS['text_main']}; font-size: 11px; font-weight: 700;")
        pf_container.addWidget(self.pf_value)

        self.pf_status = QLabel("")
        self.pf_status.setStyleSheet(f"color: {COLORS['text_main']}; font-size: 11px; font-weight: 700;")
        pf_container.addWidget(self.pf_status)

        pf_container.addStretch()
        main_layout.addLayout(pf_container)

        main_layout.addStretch()

    def update_stats(self, mem_stats):
        """Update memory statistics display"""
        used = mem_stats.get('used_memory_mb', 0)
        total = mem_stats.get('total_memory_mb', 1)
        faults = mem_stats.get('total_page_faults', 0)

        used_percent = (used / total * 100) if total > 0 else 0

        # Update utilization with bold color
        if used_percent > 80:
            color = COLORS['danger']
        elif used_percent > 50:
            color = COLORS['warning']
        else:
            color = COLORS['success']

        self.util_percent.setText(f"{used_percent:.0f}%")
        self.util_percent.setStyleSheet(f"color: {color}; font-size: 56px; font-weight: 900; line-height: 1;")

        # Update usage
        self.usage_value.setText(f"{used} / {total} MB")

        # Update page faults with status
        self.pf_value.setText(str(faults))

        if faults == 0:
            status = "(No faults)"
            pf_color = COLORS['success']
        elif faults < 5:
            status = "(Low)"
            pf_color = COLORS['success']
        elif faults < 15:
            status = "(Moderate)"
            pf_color = COLORS['warning']
        else:
            status = "(High)"
            pf_color = COLORS['danger']

        self.pf_value.setStyleSheet(f"color: {pf_color}; font-size: 11px; font-weight: 700;")
        self.pf_status.setText(status)
        self.pf_status.setStyleSheet(f"color: {COLORS['text_main']}; font-size: 11px; font-weight: 700;")

class TimelineControlWidget(QWidget):
    """Compact timeline control with playback controls"""
    def __init__(self, parent=None):
        super().__init__(parent)
        self.current_tick = 0
        self.max_tick = 100
        self.is_playing = False

        self.setup_ui()

    def setup_ui(self):
        from PyQt5.QtWidgets import QSlider

        layout = QHBoxLayout(self)
        layout.setContentsMargins(15, 10, 15, 10)
        layout.setSpacing(15)

        # Play/Pause button
        self.play_button = QPushButton("Play")
        self.play_button.setFixedSize(70, 36)
        self.play_button.setObjectName("PrimaryAction")
        self.play_button.setToolTip("Play/Pause Simulation (Space)")
        layout.addWidget(self.play_button)

        # Reset button
        self.reset_button = QPushButton("Reset")
        self.reset_button.setFixedSize(60, 36)
        self.reset_button.setToolTip("Reset Timeline")
        layout.addWidget(self.reset_button)

        layout.addSpacing(10)

        # Tick counter
        self.tick_label = QLabel("0 / 100")
        self.tick_label.setStyleSheet(f"color: {COLORS['text_main']}; font-weight: 600; font-size: 13px; min-width: 80px;")
        layout.addWidget(self.tick_label)

        # Timeline slider
        self.timeline_slider = QSlider(Qt.Horizontal)
        self.timeline_slider.setMinimum(0)
        self.timeline_slider.setMaximum(100)
        self.timeline_slider.setValue(0)
        self.timeline_slider.setFixedHeight(24)
        layout.addWidget(self.timeline_slider, 1)

        layout.addSpacing(10)

        # Speed controls - compact version
        self.speed_label = QLabel("1.0x")
        self.speed_label.setStyleSheet(f"color: {COLORS['accent_primary']}; font-weight: 600; font-size: 12px; min-width: 45px;")
        layout.addWidget(self.speed_label)

        self.speed_btn_slow = QPushButton("0.5x")
        self.speed_btn_normal = QPushButton("1x")
        self.speed_btn_fast = QPushButton("2x")
        self.speed_btn_vfast = QPushButton("5x")

        self.speed_buttons = [self.speed_btn_slow, self.speed_btn_normal, self.speed_btn_fast, self.speed_btn_vfast]

        for btn in self.speed_buttons:
            btn.setFixedSize(48, 36)
            btn.setStyleSheet(f"""
                QPushButton {{
                    background-color: {COLORS['panel_highlight']};
                    border: 1px solid {COLORS['border']};
                    border-radius: 6px;
                    color: {COLORS['text_dim']};
                    font-weight: 600;
                    font-size: 11px;
                }}
                QPushButton:hover {{
                    background-color: {COLORS['panel_elevated']};
                    color: {COLORS['accent_secondary']};
                }}
                QPushButton:checked {{
                    background-color: {COLORS['accent_primary']};
                    color: white;
                    border-color: {COLORS['accent_primary']};
                }}
            """)
            btn.setCheckable(True)
            btn.setAutoExclusive(True)
            layout.addWidget(btn)

        self.speed_btn_normal.setChecked(True)

    def update_timeline(self, current, maximum):
        self.current_tick = current
        self.max_tick = maximum
        self.timeline_slider.setMaximum(maximum)
        self.timeline_slider.setValue(current)
        self.tick_label.setText(f"{current} / {maximum}")

    def set_playing(self, playing):
        self.is_playing = playing
        self.play_button.setText("Pause" if playing else "Play")

# =============================================================================
# 4. MAIN WINDOW
# =============================================================================

class ResourceAllocationSimulator(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("SimulateX // OS Kernel Dashboard")
        self.resize(1600, 1000)

        self.graph_manager = GraphManager()
        self.is_running = False
        self.sim_speed = 1.0
        self.sim_timer = QTimer()
        self.sim_timer.timeout.connect(self.on_tick)
        self.sidebar_visible = True
        self.quantum_value = 2  # Default quantum for Round Robin

        self.setup_ui()
        self.apply_theme()

        # Intro Animation
        self.setWindowOpacity(0)
        self.anim = QPropertyAnimation(self, b"windowOpacity")
        self.anim.setDuration(1000)
        self.anim.setEndValue(1)
        self.anim.setEasingCurve(QEasingCurve.OutCubic)
        self.anim.start()

        QTimer.singleShot(300, self.update_graph_view)

    def apply_theme(self):
        self.setStyleSheet(self._build_stylesheet())

    def setup_ui(self):
        main_widget = QWidget()
        self.setCentralWidget(main_widget)
        main_layout = QVBoxLayout(main_widget)
        main_layout.setContentsMargins(0, 0, 0, 0)
        main_layout.setSpacing(0)

        # === 1. TOP BAR ===
        topbar = QFrame()
        topbar.setStyleSheet(f"""
            QFrame {{
                background-color: {COLORS['panel']};
                border-bottom: 4px solid {COLORS['border']};
            }}
        """)
        topbar.setFixedHeight(75)
        topbar_layout = QHBoxLayout(topbar)
        topbar_layout.setContentsMargins(20, 12, 20, 12)
        topbar_layout.setSpacing(25)

        # Dropdown menus
        self.menu_config = QComboBox()
        self.menu_config.addItems(["Configuration", "FCFS Scheduler", "SJF Scheduler", "Round Robin", "Set Quantum"])
        self.menu_config.setMinimumWidth(160)
        self.menu_config.currentTextChanged.connect(self.handle_config_menu)
        topbar_layout.addWidget(self.menu_config)

        self.menu_scenario = QComboBox()
        self.menu_scenario.addItem("Scenarios", None)
        for key, name, desc in ScenarioGenerator.get_all_scenarios():
            self.menu_scenario.addItem(name, key)
        self.menu_scenario.setMinimumWidth(160)
        self.menu_scenario.currentIndexChanged.connect(lambda: self.load_scenario() if self.menu_scenario.currentIndex() > 0 else None)
        topbar_layout.addWidget(self.menu_scenario)

        topbar_layout.addSpacing(15)

        # Action buttons (horizontal)
        action_btn_style = f"""
            QPushButton {{
                background: {COLORS['panel']};
                color: {COLORS['text_main']};
                border: 3px solid {COLORS['border']};
                border-radius: 0px;
                padding: 8px 14px;
                font-size: 13px;
                font-weight: 700;
            }}
            QPushButton:hover {{
                background: {COLORS['accent_primary']};
                color: white;
            }}
        """

        btn_add_proc = QPushButton("+ Process")
        btn_add_proc.setStyleSheet(action_btn_style)
        btn_add_proc.clicked.connect(self.add_process)
        topbar_layout.addWidget(btn_add_proc)

        btn_add_res = QPushButton("+ Resource")
        btn_add_res.setStyleSheet(action_btn_style)
        btn_add_res.clicked.connect(self.add_resource)
        topbar_layout.addWidget(btn_add_res)

        btn_allocate = QPushButton("Allocate")
        btn_allocate.setStyleSheet(action_btn_style)
        btn_allocate.clicked.connect(self.manage_allocation)
        topbar_layout.addWidget(btn_allocate)

        btn_release = QPushButton("Release")
        btn_release.setStyleSheet(action_btn_style)
        btn_release.clicked.connect(self.release_resource)
        topbar_layout.addWidget(btn_release)

        btn_deadlock = QPushButton("Deadlock")
        btn_deadlock.setStyleSheet(action_btn_style)
        btn_deadlock.clicked.connect(self.detect_deadlock)
        topbar_layout.addWidget(btn_deadlock)

        topbar_layout.addStretch()

        # System controls
        self.btn_toggle = QPushButton("Start")
        self.btn_toggle.setObjectName("PrimaryAction")
        self.btn_toggle.setFixedHeight(40)
        self.btn_toggle.setMinimumWidth(120)
        self.btn_toggle.clicked.connect(self.toggle_simulation)
        topbar_layout.addWidget(self.btn_toggle)

        self.btn_reset = QPushButton("Reset")
        self.btn_reset.setFixedHeight(40)
        self.btn_reset.setMinimumWidth(100)
        self.btn_reset.clicked.connect(self.reset_system)
        topbar_layout.addWidget(self.btn_reset)

        self.btn_export = QPushButton("Export")
        self.btn_export.setFixedHeight(40)
        self.btn_export.setMinimumWidth(100)
        self.btn_export.clicked.connect(self.export_to_web)
        topbar_layout.addWidget(self.btn_export)

        self.btn_save_sim = QPushButton("Save Sim")
        self.btn_save_sim.setFixedHeight(40)
        self.btn_save_sim.setMinimumWidth(100)
        self.btn_save_sim.clicked.connect(self.save_simulation)
        topbar_layout.addWidget(self.btn_save_sim)

        self.btn_restart = QPushButton("Restart")
        self.btn_restart.setFixedHeight(40)
        self.btn_restart.setMinimumWidth(100)
        self.btn_restart.clicked.connect(self.restart_simulation)
        topbar_layout.addWidget(self.btn_restart)

        self.btn_export_stats = QPushButton("Export Stats")
        self.btn_export_stats.setFixedHeight(40)
        self.btn_export_stats.setMinimumWidth(120)
        self.btn_export_stats.clicked.connect(self.export_statistics)
        topbar_layout.addWidget(self.btn_export_stats)

        # Theme selector
        self.menu_theme = QComboBox()
        self.menu_theme.addItems(["Neubrutalism", "Light", "Dark", "Ocean", "Forest"])
        self.menu_theme.setCurrentText("Neubrutalism")
        self.menu_theme.setFixedHeight(40)
        self.menu_theme.setMinimumWidth(120)
        self.menu_theme.currentTextChanged.connect(self.change_theme)
        topbar_layout.addWidget(self.menu_theme)

        main_layout.addWidget(topbar)

        # === 2. CONTENT AREA ===
        content_widget = QWidget()
        content_layout = QVBoxLayout(content_widget)
        content_layout.setContentsMargins(15, 15, 15, 15)
        content_layout.setSpacing(15)

        # Main row: Graph & Stats
        mid_row = QHBoxLayout()

        # Graph
        self.graph_card = ModernCard()
        g_layout = QVBoxLayout(self.graph_card)
        g_layout.setContentsMargins(15, 12, 15, 15)

        graph_header = QHBoxLayout()
        graph_title = QLabel("RESOURCE ALLOCATION GRAPH")
        graph_title.setStyleSheet(f"""
            color: {COLORS['text_dim']};
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 1px;
        """)
        graph_header.addWidget(graph_title)
        graph_header.addStretch()

        # Graph legend
        legend = QLabel("Process | Resource | Allocation | Request")
        legend.setStyleSheet(f"color: {COLORS['text_dimmer']}; font-size: 10px;")
        graph_header.addWidget(legend)

        g_layout.addLayout(graph_header)

        self.canvas = MplCanvas(self, width=8, height=6)
        g_layout.addWidget(self.canvas)

        # Integrated timeline controls at bottom of graph
        self.timeline_widget = TimelineControlWidget()
        g_layout.addWidget(self.timeline_widget)

        # Connect timeline controls
        self.timeline_widget.play_button.clicked.connect(self.toggle_simulation)
        self.timeline_widget.reset_button.clicked.connect(self.reset_timeline)
        self.timeline_widget.speed_btn_slow.clicked.connect(lambda: self.set_speed(0.5))
        self.timeline_widget.speed_btn_normal.clicked.connect(lambda: self.set_speed(1.0))
        self.timeline_widget.speed_btn_fast.clicked.connect(lambda: self.set_speed(2.0))
        self.timeline_widget.speed_btn_vfast.clicked.connect(lambda: self.set_speed(5.0))

        mid_row.addWidget(self.graph_card, 70)

        # Stats Panel
        stats_col = QVBoxLayout()

        # Process Queue Visualizer (moved to stats column)
        self.queue_card = ModernCard()
        self.queue_card.setMinimumHeight(220)
        qc_layout = QVBoxLayout(self.queue_card)
        qc_layout.setContentsMargins(15, 10, 15, 5)

        header_row = QHBoxLayout()
        title_lbl = QLabel("PROCESS QUEUE STATE")
        title_lbl.setStyleSheet(f"color:{COLORS['text_dim']}; font-weight:700; font-size:11px; letter-spacing:1px;")
        header_row.addWidget(title_lbl)
        self.lbl_status = QLabel("PAUSED")
        self.lbl_status.setStyleSheet(f"color:{COLORS['warning']}; font-weight:600; font-size:11px;")
        header_row.addStretch()
        header_row.addWidget(self.lbl_status)
        qc_layout.addLayout(header_row)

        self.queue_vis = QueueVisualizer()
        qc_layout.addWidget(self.queue_vis)
        stats_col.addWidget(self.queue_card, 1)

        self.mon_card = ModernCard()
        m_layout = QVBoxLayout(self.mon_card)
        m_layout.setContentsMargins(15, 12, 15, 12)
        m_layout.setSpacing(8)

        # Resources header with toggle button
        res_header = QHBoxLayout()
        res_header.setSpacing(8)

        res_title = QLabel("RESOURCES")
        res_title.setStyleSheet(f"""
            color: {COLORS['text_dim']};
            font-weight: 700;
            font-size: 11px;
            letter-spacing: 1px;
        """)
        res_header.addWidget(res_title)
        res_header.addStretch()

        # Toggle button
        self.btn_toggle_resources = QPushButton("▼")
        self.btn_toggle_resources.setFixedSize(24, 24)
        self.btn_toggle_resources.setStyleSheet(f"""
            QPushButton {{
                background: {COLORS['panel_highlight']};
                border: 1px solid {COLORS['border']};
                border-radius: 12px;
                color: {COLORS['text_dim']};
                font-size: 10px;
                font-weight: bold;
            }}
            QPushButton:hover {{
                background: {COLORS['accent_primary']};
                color: white;
            }}
        """)
        self.btn_toggle_resources.clicked.connect(self.toggle_resources_panel)
        res_header.addWidget(self.btn_toggle_resources)

        m_layout.addLayout(res_header)

        # Create scroll area for resources
        self.res_scroll = QScrollArea()
        self.res_scroll.setWidgetResizable(True)
        self.res_scroll.setHorizontalScrollBarPolicy(Qt.ScrollBarAlwaysOff)
        self.res_scroll.setVerticalScrollBarPolicy(Qt.ScrollBarAsNeeded)
        self.res_scroll.setFrameShape(QFrame.NoFrame)
        self.res_scroll.setStyleSheet(f"""
            QScrollArea {{
                background: transparent;
                border: none;
            }}
        """)
        self.res_scroll.setVisible(False)  # Collapsed by default

        self.res_monitor = ResourceMonitorWidget()
        self.res_monitor.set_graph_manager(self.graph_manager)
        self.res_scroll.setWidget(self.res_monitor)

        # Empty state for resources
        self.res_empty_label = QLabel("Click ▼ to view resources\nAdd resources to get started")
        self.res_empty_label.setStyleSheet(f"""
            color: {COLORS['text_dimmer']};
            font-size: 11px;
            padding: 20px;
        """)
        self.res_empty_label.setAlignment(Qt.AlignCenter)
        self.res_empty_label.setWordWrap(True)
        m_layout.addWidget(self.res_empty_label)

        m_layout.addWidget(self.res_scroll, 1)
        stats_col.addWidget(self.mon_card, 0)

        self.mem_card = ModernCard()
        mem_layout = QVBoxLayout(self.mem_card)
        mem_layout.setContentsMargins(15, 12, 15, 12)

        mem_title = QLabel("MEMORY STATUS")
        mem_title.setStyleSheet(f"""
            color: {COLORS['text_dim']};
            font-weight: 700;
            font-size: 11px;
            letter-spacing: 1px;
            margin-bottom: 8px;
        """)
        mem_layout.addWidget(mem_title)

        self.mem_widget = MemoryStatusWidget()
        mem_layout.addWidget(self.mem_widget)
        mem_layout.addStretch()
        stats_col.addWidget(self.mem_card, 1)

        # Store stats_col reference for dynamic layout adjustment
        self.stats_col = stats_col

        mid_row.addLayout(stats_col, 30)
        content_layout.addLayout(mid_row, 3) # Weighted 3 for taller graph

        # Bottom: Terminal & Gantt Tab
        self.log_card = ModernCard()
        self.log_card.setFixedHeight(350)
        l_layout = QVBoxLayout(self.log_card)
        l_layout.setContentsMargins(15, 10, 15, 15)

        # Enhanced Tab-like toggle
        tab_layout = QHBoxLayout()
        tab_layout.setSpacing(8)

        self.btn_show_log = QPushButton("Terminal")
        self.btn_show_gantt = QPushButton("Gantt Chart")
        self.btn_show_log.setCheckable(True)
        self.btn_show_log.setChecked(True)
        self.btn_show_gantt.setCheckable(True)

        # Function to handle tab switching with animation
        def switch_tab(idx):
            self.stack_log.setVisible(idx == 0)
            self.stack_gantt.setVisible(idx == 1)

            # Neubrutalism tab styling
            active_style = f"""
                QPushButton {{
                    background: {COLORS['accent_primary']};
                    color: white;
                    border: 3px solid {COLORS['border']};
                    border-radius: 0px;
                    padding: 10px 20px;
                    font-weight: 900;
                }}
            """
            inactive_style = f"""
                QPushButton {{
                    background: {COLORS['panel']};
                    color: {COLORS['text_main']};
                    border: 3px solid {COLORS['border']};
                    border-radius: 0px;
                    padding: 10px 20px;
                    font-weight: 700;
                }}
                QPushButton:hover {{
                    background: {COLORS['panel_highlight']};
                }}
            """

            self.btn_show_log.setStyleSheet(active_style if idx == 0 else inactive_style)
            self.btn_show_gantt.setStyleSheet(active_style if idx == 1 else inactive_style)

        self.btn_show_log.clicked.connect(lambda: switch_tab(0))
        self.btn_show_gantt.clicked.connect(lambda: switch_tab(1))

        tab_layout.addWidget(self.btn_show_log)
        tab_layout.addWidget(self.btn_show_gantt)
        tab_layout.addStretch()

        # Add clear button
        clear_btn = QPushButton("Clear")
        clear_btn.setFixedWidth(80)
        clear_btn.setStyleSheet(f"""
            QPushButton {{
                background: {COLORS['panel']};
                color: {COLORS['text_main']};
                border: 3px solid {COLORS['border']};
                border-radius: 0px;
                padding: 8px;
                font-size: 11px;
                font-weight: 700;
            }}
            QPushButton:hover {{
                background: {COLORS['danger']};
                color: white;
                border-color: {COLORS['danger']};
            }}
        """)
        clear_btn.clicked.connect(lambda: self.console.clear())
        tab_layout.addWidget(clear_btn)

        l_layout.addLayout(tab_layout)

        # Stack Content
        self.stack_log = QWidget()
        sl_layout = QVBoxLayout(self.stack_log)
        sl_layout.setContentsMargins(0, 8, 0, 0)
        sl_layout.setSpacing(8)

        self.console = QTextEdit()
        self.console.setReadOnly(True)

        self.cli = QLineEdit()
        self.cli.setPlaceholderText("Enter command (help, ap, ar, alloc, release, status, check, export, reset)...")

        # Initialize console styling
        self.update_console_styling()
        self.cli.returnPressed.connect(self.process_cli)
        sl_layout.addWidget(self.console)
        sl_layout.addWidget(self.cli)

        self.stack_gantt = QWidget(); self.stack_gantt.setVisible(False)
        sg_layout = QVBoxLayout(self.stack_gantt); sg_layout.setContentsMargins(0,0,0,0)
        self.gantt_vis = GanttChartWidget()
        sg_layout.addWidget(self.gantt_vis)

        l_layout.addWidget(self.stack_log)
        l_layout.addWidget(self.stack_gantt)

        content_layout.addWidget(self.log_card)
        main_layout.addWidget(content_widget)

    # --- UI Helpers ---
    def create_config_group(self, layout):
        g = QGroupBox("SCHEDULER")
        l = QVBoxLayout()
        l.setSpacing(8)

        algo_label = QLabel("Algorithm")
        algo_label.setStyleSheet(f"color: {COLORS['text_dim']}; font-size: 12px; font-weight: 500;")
        l.addWidget(algo_label)

        self.combo_algo = QComboBox()
        self.combo_algo.addItems(["First Come First Serve", "Shortest Job First", "Round Robin"])
        self.combo_algo.currentTextChanged.connect(self.on_algorithm_changed)
        l.addWidget(self.combo_algo)

        l.addSpacing(4)

        quantum_label = QLabel("Time Quantum")
        quantum_label.setStyleSheet(f"color: {COLORS['text_dim']}; font-size: 12px; font-weight: 500;")
        l.addWidget(quantum_label)

        self.spin_quant = QSpinBox()
        self.spin_quant.setValue(2)
        self.spin_quant.valueChanged.connect(self.on_quantum_changed)
        l.addWidget(self.spin_quant)
        g.setLayout(l)
        layout.addWidget(g)

    def create_scenario_group(self, layout):
        g = QGroupBox("SCENARIOS")
        l = QVBoxLayout()
        l.setSpacing(8)
        self.combo_scen = QComboBox()
        self.combo_scen.addItem("Select scenario...", None)
        for key, name, desc in ScenarioGenerator.get_all_scenarios():
            self.combo_scen.addItem(name, key)
        l.addWidget(self.combo_scen)
        l.addWidget(self.create_btn("Load Scenario", self.load_scenario, "PrimaryAction"))
        g.setLayout(l)
        layout.addWidget(g)

    def create_action_group(self, layout):
        g = QGroupBox("ACTIONS")
        l = QVBoxLayout()
        l.addWidget(self.create_btn("Add Process", self.add_process))
        l.addWidget(self.create_btn("Add Resource", self.add_resource))
        l.addWidget(self.create_btn("Allocate", self.manage_allocation))
        l.addWidget(self.create_btn("Release", self.release_resource))
        g.setLayout(l)
        layout.addWidget(g)

    def create_system_group(self, layout):
        g = QGroupBox("SYSTEM")
        l = QVBoxLayout()
        self.btn_toggle = self.create_btn("Start Sim", self.toggle_simulation, "SuccessAction")
        l.addWidget(self.btn_toggle)
        l.addWidget(self.create_btn("Check Deadlock", self.detect_deadlock, "DangerAction"))
        l.addWidget(self.create_btn("Reset", self.reset_system))
        g.setLayout(l)
        layout.addWidget(g)

    def create_btn(self, text, func, obj_name=""):
        btn = QPushButton(text)
        if obj_name: btn.setObjectName(obj_name)
        btn.clicked.connect(func)
        btn.setCursor(Qt.PointingHandCursor)
        return btn

    def handle_config_menu(self, text):
        """Handle configuration dropdown menu"""
        if text == "Configuration":
            return
        elif "FCFS" in text:
            self.on_algorithm_changed("First Come First Serve")
        elif "SJF" in text:
            self.on_algorithm_changed("Shortest Job First")
        elif "Round Robin" in text:
            self.on_algorithm_changed("Round Robin")
        elif "Quantum" in text:
            val, ok = QInputDialog.getInt(self, "Set Quantum", "Time Quantum:", self.quantum_value, 1, 100)
            if ok:
                self.quantum_value = val
                self.on_quantum_changed(val)
        # Reset to default
        self.menu_config.setCurrentIndex(0)

    def log(self, msg, type="info"):
        import datetime
        t = datetime.datetime.now().strftime("%H:%M:%S")

        # Enhanced color mapping with icons
        type_config = {
            "error": (COLORS['danger'], "[!]"),
            "success": (COLORS['success'], "[+]"),
            "cmd": (COLORS['accent_secondary'], ">"),
            "warning": (COLORS['warning'], "[*]"),
            "info": (COLORS['text_main'], "ℹ")
        }

        color, icon = type_config.get(type, (COLORS['text_main'], "•"))

        # Format message with better styling
        self.console.append(f"""
            <div style='margin: 2px 0; padding: 4px 0;'>
                <span style='color:{COLORS['text_dimmer']}; font-size: 10px;'>[{t}]</span>
                <span style='color:{color}; font-weight: 600;'> {icon}</span>
                <span style='color:{color}; margin-left: 5px;'>{msg}</span>
            </div>
        """)

        sb = self.console.verticalScrollBar()
        sb.setValue(sb.maximum())

    # --- Logic ---

    def process_cli(self):
        cmd = self.cli.text().strip()
        if not cmd: return
        self.log(f"$ {cmd}", "cmd")
        self.cli.clear()
        # Parsing logic
        parts = cmd.split()
        cmd_name = parts[0].lower()

        if cmd_name == "help":
            self.log("Available Commands:", "info")
            self.log("  ap / add_process - Add a new process", "info")
            self.log("  ar / add_resource - Add a new resource", "info")
            self.log("  alloc <P#> <R#> - Allocate/request resource", "info")
            self.log("  release <R#> <P#> - Release resource from process", "info")
            self.log("  status - Show system status", "info")
            self.log("  check / deadlock - Check for deadlocks", "info")
            self.log("  export [filename] - Export graph to HTML", "info")
            self.log("  reset - Reset the simulation", "info")
            self.log("  wait <P#> <event> - Process waits for event", "info")
            self.log("  signal <event> - Signal an event", "info")

        elif cmd_name in ["ap", "add_process"]:
            self.add_process()

        elif cmd_name in ["ar", "add_resource"]:
            self.add_resource()

        elif cmd_name == "alloc":
            if len(parts) != 3:
                self.log("Usage: alloc <process_id> <resource_id>", "error")
                return
            pid, rid = parts[1].upper(), parts[2].upper()
            status, msg = self.graph_manager.allocate_resource(pid, rid)
            if status == "success":
                self.log(msg, "success")
            elif status == "wait":
                self.log(msg, "warning")
            else:
                self.log(msg, "error")
            self.update_graph_view()

        elif cmd_name == "release":
            if len(parts) != 3:
                self.log("Usage: release <resource_id> <process_id>", "error")
                return
            rid, pid = parts[1].upper(), parts[2].upper()
            success, msg = self.graph_manager.release_resource(rid, pid)
            if success:
                self.log(msg, "success")
            else:
                self.log(msg, "error")
            self.update_graph_view()

        elif cmd_name == "status":
            self.log("=== SYSTEM STATUS ===", "info")
            # Resources
            self.log("Resources:", "info")
            if not any(n.startswith("R") for n in self.graph_manager.graph.nodes):
                self.log("  (None)", "info")
            for n in self.graph_manager.graph.nodes:
                if n.startswith("R"):
                    info = self.graph_manager.resource_instances[n]
                    self.log(f"  {n}: {info['available']}/{info['total']} available", "info")
            # Processes
            self.log("Processes:", "info")
            procs = [n for n in self.graph_manager.graph.nodes if n.startswith("P")]
            if not procs:
                self.log("  (None)", "info")
            for p in procs:
                holding = self.graph_manager.allocations.get(p, {})
                holding_str = ", ".join([f"{k}({v})" for k,v in holding.items()]) if holding else "None"
                waiting = self.graph_manager.requests.get(p, {})
                waiting_str = ", ".join([f"{k}({v})" for k,v in waiting.items()]) if waiting else "None"
                self.log(f"  {p} | Holding: [{holding_str}] | Waiting: [{waiting_str}]", "info")

        elif cmd_name in ["check", "deadlock"]:
            self.detect_deadlock()

        elif cmd_name == "export":
            filename = parts[1] if len(parts) > 1 else "resource_graph.html"
            if not filename.endswith(".html"):
                filename += ".html"
            try:
                from web_exporter import WebExporter
                path = WebExporter.export_to_html(self.graph_manager, filename)
                self.log(f"Successfully exported to: {path}", "success")
            except Exception as e:
                self.log(f"Export failed: {e}", "error")

        elif cmd_name == "reset":
            self.reset_simulation()

        elif cmd_name == "wait":
            if len(parts) < 3:
                self.log("Usage: wait <process_id> <event_name>", "error")
                return
            pid = parts[1].upper()
            event = parts[2]
            if hasattr(self.graph_manager, 'wait_for_event'):
                self.graph_manager.wait_for_event(pid, event)
                self.log(f"{pid} now waiting for event '{event}'", "warning")
                self.update_graph_view()
            else:
                self.log("Event system not implemented", "error")

        elif cmd_name == "signal":
            if len(parts) < 2:
                self.log("Usage: signal <event_name>", "error")
                return
            event = parts[1]
            if hasattr(self.graph_manager, 'signal_event'):
                self.graph_manager.signal_event(event)
                self.log(f"Signaled event '{event}'", "success")
                self.update_graph_view()
            else:
                self.log("Event system not implemented", "error")

        else:
            self.log(f"Unknown command: {cmd_name}", "error")
            self.log("Type 'help' for available commands", "info")

    def toggle_simulation(self):
        self.is_running = not self.is_running
        if self.is_running:
            interval = int(1000 / self.sim_speed)
            self.sim_timer.start(interval)
            if hasattr(self, 'btn_toggle'):
                self.btn_toggle.setText("Pause")
            self.timeline_widget.set_playing(True)
            self.lbl_status.setText("RUNNING")
            self.lbl_status.setStyleSheet(f"color:{COLORS['success']}; font-weight:600; font-size:12px;")
            self.log("Simulation started", "success")
        else:
            self.sim_timer.stop()
            if hasattr(self, 'btn_toggle'):
                self.btn_toggle.setText("Start")
            self.timeline_widget.set_playing(False)
            self.lbl_status.setText("PAUSED")
            self.lbl_status.setStyleSheet(f"color:{COLORS['warning']}; font-weight:600; font-size:12px;")
            self.log("Simulation paused", "warning")

    def step_simulation(self):
        """Step simulation forward by one tick"""
        if not self.is_running:
            self.graph_manager.tick()
            self.update_graph_view()
            self.log("Stepped forward 1 tick", "info")

    def reset_timeline(self):
        """Reset timeline to beginning"""
        if hasattr(self.graph_manager, 'clear_timeline'):
            self.graph_manager.clear_timeline()
        self.timeline_widget.update_timeline(0, 100)
        self.update_graph_view()
        self.log("Timeline reset", "warning")

    def set_speed(self, speed):
        """Set simulation speed multiplier"""
        self.sim_speed = speed
        self.timeline_widget.speed_label.setText(f"{speed}x")

        # Update all speed buttons
        self.timeline_widget.speed_btn_slow.setChecked(speed == 0.5)
        self.timeline_widget.speed_btn_normal.setChecked(speed == 1.0)
        self.timeline_widget.speed_btn_fast.setChecked(speed == 2.0)
        self.timeline_widget.speed_btn_vfast.setChecked(speed == 5.0)

        if self.is_running:
            interval = int(1000 / self.sim_speed)
            self.sim_timer.start(interval)

        self.log(f"Simulation speed: {speed}x", "cmd")

    def on_tick(self):
        self.graph_manager.tick()
        self.update_graph_view()

        # Update timeline
        current = self.graph_manager.global_tick_counter
        max_tick = max(current + 10, 100)
        self.timeline_widget.update_timeline(current, max_tick)

    def update_graph_view(self):
        self.canvas.axes.clear()

        # 1. Update Monitor Data
        self.queue_vis.update_data(self.graph_manager.running_queue, self.graph_manager.ready_queue, self.graph_manager.blocked_queue, self.graph_manager.process_info)
        self.res_monitor.update_stats(self.graph_manager.get_resource_utilization())

        if hasattr(self.graph_manager, 'get_gantt_data'):
            self.gantt_vis.update_data(self.graph_manager.get_gantt_data(), self.graph_manager.global_tick_counter)

        mem = self.graph_manager.get_memory_stats()
        self.mem_widget.update_stats(mem)

        # 2. Draw Graph
        G = self.graph_manager.graph
        if G.number_of_nodes() == 0:
            # Draw empty state with grid
            self.canvas.axes.set_xlim(0, 10)
            self.canvas.axes.set_ylim(0, 10)
            self.canvas.axes.grid(True, alpha=0.1, color=COLORS['border'])
            self.canvas.axes.text(5, 5, 'No processes or resources yet\nAdd some to see the graph',
                                 ha='center', va='center', fontsize=12, color=COLORS['text_dim'])
            self.canvas.draw()
            return

        pos = nx.spring_layout(G, seed=42, k=0.9, iterations=50)

        # Add grid background
        self.canvas.axes.grid(True, alpha=0.15, linestyle='--', linewidth=0.5, color=COLORS['border'])

        # Draw Nodes
        procs = [n for n in G.nodes if n.startswith("P")]
        res = [n for n in G.nodes if n.startswith("R")]

        # Resources (Squares)
        nx.draw_networkx_nodes(G, pos, nodelist=res, node_color='#ffffff',
                             node_shape='s', node_size=1300, ax=self.canvas.axes,
                             edgecolors=COLORS['accent_primary'], linewidths=3.0)

        # Processes (Circles) - Clean aesthetic coloring
        running = self.graph_manager.running_queue[0] if self.graph_manager.running_queue else None
        p_colors = []
        p_borders = []
        for p in procs:
            if p == running:
                # Running: Vibrant green with white fill
                p_colors.append('#ffffff')
                p_borders.append('#10b981')
            elif p in self.graph_manager.blocked_queue:
                # Blocked: Soft red with white fill
                p_colors.append('#ffffff')
                p_borders.append('#ef4444')
            else:
                # Ready: Clean blue with white fill
                p_colors.append('#ffffff')
                p_borders.append(COLORS['accent_primary'])

        nx.draw_networkx_nodes(G, pos, nodelist=procs, node_color=p_colors,
                             node_shape='o', node_size=900, ax=self.canvas.axes,
                             edgecolors=p_borders, linewidths=3.5)

        # Edges
        req_edges = [(u, v) for u, v in G.edges if G.edges[u, v].get('type') == 'request']
        alloc_edges = [(u, v) for u, v in G.edges if G.edges[u, v].get('type') != 'request']

        nx.draw_networkx_edges(G, pos, edgelist=req_edges, style='dashed', edge_color=COLORS['text_dimmer'],
                             width=2.5, ax=self.canvas.axes, arrowsize=18, alpha=0.7)
        nx.draw_networkx_edges(G, pos, edgelist=alloc_edges, edge_color=COLORS['accent_primary'],
                             width=3.0, ax=self.canvas.axes, arrowsize=22)

        # Labels
        labels = {}
        for n in G.nodes:
            if n in res:
                d = self.graph_manager.resource_instances.get(n, {'available':0, 'total':0})
                labels[n] = f"{n}\n{d['available']}/{d['total']}"
            else:
                rem = self.graph_manager.process_info.get(n, {}).get('remaining', 0)
                labels[n] = f"{n}\n{rem}s"

        nx.draw_networkx_labels(G, pos, labels, font_color=COLORS['text_main'], font_size=10, font_weight='bold', ax=self.canvas.axes)
        self.canvas.draw()

    # --- Actions Wrappers ---
    def add_process(self):
        burst, ok = QInputDialog.getInt(self, "New Process", "Burst Time:", 10, 1, 100)
        if ok:
            pid = self.graph_manager.add_process(burst)
            self.log(f"Spawned {pid}", "success")
            self.update_graph_view()

    def add_resource(self):
        qty, ok = QInputDialog.getInt(self, "New Resource", "Instances:", 3, 1, 20)
        if ok:
            rid = self.graph_manager.add_resource(qty)
            self.log(f"Created {rid} (x{qty})", "success")
            self.update_graph_view()

    def manage_allocation(self):
        # Get all processes and resources
        processes = [n for n in self.graph_manager.graph.nodes if n.startswith("P")]
        resources = [n for n in self.graph_manager.graph.nodes if n.startswith("R")]

        if not processes:
            self.log("No processes available. Add a process first.", "error")
            return
        if not resources:
            self.log("No resources available. Add a resource first.", "error")
            return

        # Create dialog
        from PyQt5.QtWidgets import QDialog, QVBoxLayout, QHBoxLayout, QLabel, QComboBox, QPushButton, QDialogButtonBox

        dialog = QDialog(self)
        dialog.setWindowTitle("Allocate Resource")
        dialog.setMinimumWidth(350)
        layout = QVBoxLayout(dialog)

        # Process selection
        proc_layout = QHBoxLayout()
        proc_layout.addWidget(QLabel("Process:"))
        proc_combo = QComboBox()
        proc_combo.addItems(processes)
        proc_layout.addWidget(proc_combo)
        layout.addLayout(proc_layout)

        # Resource selection
        res_layout = QHBoxLayout()
        res_layout.addWidget(QLabel("Resource:"))
        res_combo = QComboBox()
        res_combo.addItems(resources)
        res_layout.addWidget(res_combo)
        layout.addLayout(res_layout)

        # Buttons
        buttons = QDialogButtonBox(QDialogButtonBox.Ok | QDialogButtonBox.Cancel)
        buttons.accepted.connect(dialog.accept)
        buttons.rejected.connect(dialog.reject)
        layout.addWidget(buttons)

        # Show dialog
        if dialog.exec_() == QDialog.Accepted:
            pid = proc_combo.currentText()
            rid = res_combo.currentText()
            status, msg = self.graph_manager.allocate_resource(pid, rid)
            if status == "success":
                self.log(msg, "success")
            elif status == "wait":
                self.log(msg, "warning")
            else:
                self.log(msg, "error")
            self.update_graph_view()

    def release_resource(self):
        # Get all resources and processes
        resources = [n for n in self.graph_manager.graph.nodes if n.startswith("R")]
        processes = [n for n in self.graph_manager.graph.nodes if n.startswith("P")]

        if not resources:
            self.log("No resources available.", "error")
            return
        if not processes:
            self.log("No processes available.", "error")
            return

        # Create dialog
        from PyQt5.QtWidgets import QDialog, QVBoxLayout, QHBoxLayout, QLabel, QComboBox, QPushButton, QDialogButtonBox

        dialog = QDialog(self)
        dialog.setWindowTitle("Release Resource")
        dialog.setMinimumWidth(350)
        layout = QVBoxLayout(dialog)

        # Resource selection
        res_layout = QHBoxLayout()
        res_layout.addWidget(QLabel("Resource:"))
        res_combo = QComboBox()
        res_combo.addItems(resources)
        res_layout.addWidget(res_combo)
        layout.addLayout(res_layout)

        # Process selection
        proc_layout = QHBoxLayout()
        proc_layout.addWidget(QLabel("Process:"))
        proc_combo = QComboBox()
        proc_combo.addItems(processes)
        proc_layout.addWidget(proc_combo)
        layout.addLayout(proc_layout)

        # Buttons
        buttons = QDialogButtonBox(QDialogButtonBox.Ok | QDialogButtonBox.Cancel)
        buttons.accepted.connect(dialog.accept)
        buttons.rejected.connect(dialog.reject)
        layout.addWidget(buttons)

        # Show dialog
        if dialog.exec_() == QDialog.Accepted:
            rid = res_combo.currentText()
            pid = proc_combo.currentText()
            success, msg = self.graph_manager.release_resource(rid, pid)
            if success:
                self.log(msg, "success")
            else:
                self.log(msg, "error")
            self.update_graph_view()

    def detect_deadlock(self):
        cycle = self.graph_manager.get_deadlock_cycle()
        if cycle:
            # Format cycle for better readability
            cycle_str = " → ".join([f"{edge[0]}" for edge in cycle]) + f" → {cycle[0][0]}"
            self.log("=" * 50, "error")
            self.log("DEADLOCK DETECTED!", "error")
            self.log(f"Circular wait cycle: {cycle_str}", "error")
            self.log("=" * 50, "error")

            # Show blocked processes
            blocked = self.graph_manager.get_blocked_processes()
            if blocked:
                self.log("Blocked processes:", "warning")
                for pid, resources in blocked.items():
                    self.log(f"  {pid} waiting for: {', '.join(resources)}", "warning")

            QMessageBox.critical(self, "DEADLOCK DETECTED",
                               f"Circular wait dependency found!\n\n{cycle_str}\n\nAll involved processes are blocked.")
        else:
            # Check if there are any blocked processes at all
            blocked = self.graph_manager.get_blocked_processes()
            if blocked:
                self.log("No circular deadlock detected, but processes are blocked:", "warning")
                for pid, resources in blocked.items():
                    self.log(f"  {pid} waiting for: {', '.join(resources)}", "info")

                # Debug: Show what each blocked process's requested resources are held by
                self.log("", "info")
                self.log("Analyzing blocking situation:", "cmd")
                for pid in blocked:
                    for resource in blocked[pid]:
                        # Find who holds this resource
                        holders = []
                        for holder_pid in self.graph_manager.allocations:
                            if resource in self.graph_manager.allocations[holder_pid]:
                                if self.graph_manager.allocations[holder_pid][resource] > 0:
                                    holders.append(holder_pid)
                        if holders:
                            holders_str = ", ".join(holders)
                            self.log(f"  {pid} waits for {resource} (held by: {holders_str})", "info")
                            # Check if any holder is also blocked
                            for holder in holders:
                                if holder in blocked:
                                    self.log(f"    → {holder} is ALSO blocked! (Potential circular wait)", "warning")
            else:
                self.log("System Check: No deadlock, no blocked processes", "success")

    def reset_system(self):
        self.graph_manager = GraphManager()
        self.log("System Reset", "warning")
        self.update_graph_view()

    def save_simulation(self):
        """Save current simulation state for restart"""
        self.graph_manager.create_snapshot()
        self.log("Simulation state saved - use Restart to restore", "success")
        QMessageBox.information(self, "Simulation Saved",
            "Current simulation state has been saved.\nYou can restart from this point using the Restart button.")

    def restart_simulation(self):
        """Restart simulation from saved snapshot"""
        if not hasattr(self.graph_manager, 'initial_snapshot') or self.graph_manager.initial_snapshot is None:
            self.log("No saved simulation found - use Save Sim first", "warning")
            QMessageBox.warning(self, "No Saved State",
                "No saved simulation state found.\nUse 'Save Sim' button to save current state first.")
            return

        if self.is_running:
            self.toggle_simulation()

        success = self.graph_manager.restore_snapshot()
        if success is False and not hasattr(self.graph_manager, 'ready_queue'):
            self.log("Restart failed", "error")
            return

        self.log("Simulation restarted from saved state", "info")
        self.update_graph_view()
        self.update_all_widgets()
        QMessageBox.information(self, "Simulation Restarted",
            "Simulation has been restored to the saved state.")

    def export_statistics(self):
        """Export detailed simulation statistics to CSV"""
        if not BACKEND_LOADED:
            self.log("Backend not loaded - cannot export statistics", "error")
            return

        try:
            # Get save location
            default_name = f"simulation_stats_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
            filepath, _ = QFileDialog.getSaveFileName(
                self, "Export Statistics", default_name, "CSV Files (*.csv);;All Files (*)")

            if not filepath:
                return

            # Collect statistics
            process_stats = []
            total_time = self.graph_manager.global_tick_counter
            completed_processes = 0
            total_turnaround = 0
            total_waiting = 0
            total_response = 0

            for pid, info in self.graph_manager.process_info.items():
                arrival = info.get('arrival', 0)
                burst = info.get('burst', 0)
                remaining = info.get('remaining', 0)
                state = self.graph_manager.process_states.get(pid, 'unknown')

                # Calculate completion time
                completion = None
                if remaining == 0 or state == 'terminated':
                    completion = total_time
                    completed_processes += 1

                # Calculate times
                turnaround = (completion - arrival) if completion else None
                waiting = self.graph_manager.waiting_times.get(pid, 0)
                response = self.graph_manager.response_times.get(pid, None)

                if turnaround:
                    total_turnaround += turnaround
                if waiting:
                    total_waiting += waiting
                if response is not None:
                    total_response += response

                process_stats.append({
                    'Process ID': pid,
                    'Arrival Time': arrival,
                    'Burst Time': burst,
                    'Completion Time': completion if completion else 'N/A',
                    'Turnaround Time': turnaround if turnaround else 'N/A',
                    'Waiting Time': waiting,
                    'Response Time': response if response is not None else 'N/A',
                    'State': state,
                    'Remaining Time': remaining
                })

            # Calculate averages
            avg_turnaround = total_turnaround / completed_processes if completed_processes > 0 else 0
            avg_waiting = total_waiting / len(process_stats) if process_stats else 0
            avg_response = total_response / completed_processes if completed_processes > 0 else 0
            throughput = completed_processes / total_time if total_time > 0 else 0

            # Write to CSV
            with open(filepath, 'w', newline='') as csvfile:
                # Write header information
                csvfile.write(f"Simulation Statistics Export\n")
                csvfile.write(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
                csvfile.write(f"Scheduler: {self.graph_manager.scheduler_mode}\n")
                csvfile.write(f"Time Quantum: {self.graph_manager.time_quantum}\n")
                csvfile.write(f"Total Simulation Time: {total_time} ticks\n")
                csvfile.write(f"Context Switches: {self.graph_manager.context_switches}\n")
                csvfile.write(f"\n")

                # Write summary statistics
                csvfile.write(f"Summary Statistics\n")
                csvfile.write(f"Total Processes,{len(process_stats)}\n")
                csvfile.write(f"Completed Processes,{completed_processes}\n")
                csvfile.write(f"Throughput (processes/tick),{throughput:.4f}\n")
                csvfile.write(f"Average Turnaround Time,{avg_turnaround:.2f}\n")
                csvfile.write(f"Average Waiting Time,{avg_waiting:.2f}\n")
                csvfile.write(f"Average Response Time,{avg_response:.2f}\n")
                csvfile.write(f"CPU Utilization %,{(total_time / max(total_time, 1)) * 100:.2f}\n")
                csvfile.write(f"\n")

                # Write per-process statistics
                csvfile.write(f"Per-Process Statistics\n")
                fieldnames = ['Process ID', 'Arrival Time', 'Burst Time', 'Completion Time',
                             'Turnaround Time', 'Waiting Time', 'Response Time', 'State', 'Remaining Time']
                writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
                writer.writeheader()
                writer.writerows(process_stats)

                # Write memory statistics if available
                if hasattr(self.graph_manager, 'page_faults') and self.graph_manager.page_faults:
                    csvfile.write(f"\n")
                    csvfile.write(f"Memory Statistics\n")
                    csvfile.write(f"Process ID,Page Faults\n")
                    for pid, faults in self.graph_manager.page_faults.items():
                        csvfile.write(f"{pid},{faults}\n")

            self.log(f"Statistics exported to: {filepath}", "success")
            QMessageBox.information(self, "Export Successful",
                f"Statistics exported to:\n{filepath}\n\n"
                f"Completed Processes: {completed_processes}/{len(process_stats)}\n"
                f"Avg Turnaround Time: {avg_turnaround:.2f}\n"
                f"Avg Waiting Time: {avg_waiting:.2f}\n"
                f"Throughput: {throughput:.4f} processes/tick")

        except Exception as e:
            self.log(f"Export failed: {str(e)}", "error")
            QMessageBox.critical(self, "Export Failed", f"Failed to export statistics:\n{str(e)}")

    def export_to_web(self):
        """Export current graph to HTML using WebExporter"""
        if not BACKEND_LOADED:
            self.log("Backend not loaded - cannot export", "error")
            return

        try:
            filepath = WebExporter.export_to_html(self.graph_manager)
            self.log(f"Graph exported to: {filepath}", "success")

            # Ask if user wants to open the file
            reply = QMessageBox.question(self, "Export Successful",
                f"Graph exported to:\n{filepath}\n\nOpen in browser?",
                QMessageBox.Yes | QMessageBox.No)

            if reply == QMessageBox.Yes:
                import webbrowser
                webbrowser.open(f"file:///{filepath}")
        except Exception as e:
            self.log(f"Export failed: {str(e)}", "error")
            QMessageBox.critical(self, "Export Failed", f"Failed to export graph:\n{str(e)}")

    def change_theme(self, theme_name):
        """Change the application theme"""
        global COLORS
        if theme_name in THEMES:
            COLORS = THEMES[theme_name]
            # Rebuild stylesheet
            global STYLESHEET
            STYLESHEET = self._build_stylesheet()
            self.apply_theme()
            # Update matplotlib colors
            plt.rcParams['text.color'] = COLORS['text_main']
            plt.rcParams['axes.labelcolor'] = COLORS['text_main']
            plt.rcParams['xtick.color'] = COLORS['text_dim']
            plt.rcParams['ytick.color'] = COLORS['text_dim']
            self.canvas.fig.patch.set_facecolor(COLORS['panel'])
            self.canvas.axes.set_facecolor(COLORS['panel'])
            # Update console styling
            self.update_console_styling()
            # Refresh widgets
            self.queue_vis.update()
            # Refresh the UI
            self.update_graph_view()
            self.log(f"Theme changed to: {theme_name}", "success")

    def update_console_styling(self):
        """Update console styling to match current theme"""
        self.console.setStyleSheet(f"""
            QTextEdit {{
                background-color: {COLORS['panel']};
                border: 1px solid {COLORS['border']};
                border-radius: 10px;
                color: {COLORS['text_main']};
                font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
                font-size: 14px;
                line-height: 1.6;
                padding: 15px;
            }}
        """)
        self.console.setHtml(f"""
            <div style='color:{COLORS['accent_primary']}; font-weight: 600; font-size: 15px;'>
            ╔═══════════════════════════════════════════════╗<br>
            ║&nbsp;&nbsp;SimulateX Kernel Terminal v3.0&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;║<br>
            ╚═══════════════════════════════════════════════╝<br>
            </div>
            <div style='color:{COLORS['text_dim']}; margin-top: 10px; font-size: 14px;'>
            <span style='color:{COLORS['success']};'>root@simulatex</span>:<span style='color:{COLORS['accent_secondary']};'>~</span>$ System initialized<br>
            Type 'help' for available commands.
            </div>
        """)

        self.cli.setStyleSheet(f"""
            QLineEdit {{
                background-color: {COLORS['panel_elevated']};
                border: 1.5px solid {COLORS['border']};
                border-radius: 8px;
                padding: 14px 16px;
                color: {COLORS['text_main']};
                font-family: 'JetBrains Mono', 'Consolas', monospace;
                font-size: 14px;
            }}
            QLineEdit:focus {{
                border: 2px solid {COLORS['accent_primary']};
                background-color: {COLORS['panel_highlight']};
            }}
        """)

    def _build_stylesheet(self):
        """Build the stylesheet dynamically based on current COLORS"""
        return f"""
QMainWindow {{ background-color: {COLORS['bg']}; }}
QWidget {{ font-family: 'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', sans-serif; color: {COLORS['text_main']}; font-size: 13px; }}

/* --- SCROLL BARS --- */
QScrollBar:vertical {{ border: none; background: {COLORS['bg']}; width: 10px; margin: 0px; }}
QScrollBar::handle:vertical {{ background: {COLORS['panel_highlight']}; min-height: 20px; border-radius: 5px; }}
QScrollBar::handle:vertical:hover {{ background: {COLORS['accent_primary']}; }}
QScrollBar::add-line:vertical, QScrollBar::sub-line:vertical {{ height: 0px; }}
QScrollBar:horizontal {{ border: none; background: {COLORS['bg']}; height: 10px; }}
QScrollBar::handle:horizontal {{ background: {COLORS['panel_highlight']}; min-width: 20px; border-radius: 5px; }}
QScrollBar::handle:horizontal:hover {{ background: {COLORS['accent_primary']}; }}
QScrollBar::add-line:horizontal, QScrollBar::sub-line:horizontal {{ width: 0px; }}

/* --- PANELS & FRAMES --- */
QFrame#Card {{
    background-color: {COLORS['panel']};
    border: 1px solid {COLORS['border']};
    border-radius: 16px;
}}
QFrame#SidePanel {{
    background-color: {COLORS['panel']};
    border-right: 1px solid {COLORS['border']};
}}
QFrame#TimelinePanel {{
    background: qlineargradient(x1:0, y1:0, x2:0, y2:1,
        stop:0 {COLORS['panel_elevated']},
        stop:1 {COLORS['panel']});
    border: 1px solid {COLORS['border_light']};
    border-radius: 16px;
}}

/* --- BUTTONS --- */
QPushButton {{
    background-color: {COLORS['panel_highlight']};
    border: 1px solid {COLORS['border']};
    border-radius: 7px;
    padding: 11px 16px;
    color: {COLORS['text_main']};
    font-weight: 500;
    text-align: left;
    font-size: 13px;
}}
QPushButton:hover {{
    background-color: {COLORS['panel_elevated']};
    border-color: {COLORS['border_light']};
}}
QPushButton:pressed {{
    background-color: {COLORS['panel_elevated']};
    border-color: {COLORS['accent_primary']};
}}

/* Special Buttons */
QPushButton#PrimaryAction {{
    background-color: {COLORS['accent_primary']};
    color: white;
    border: none;
    font-weight: 600;
}}
QPushButton#PrimaryAction:hover {{
    background-color: {COLORS['accent_tertiary']};
}}
QPushButton#DangerAction {{ border-left: 2px solid {COLORS['danger']}; }}
QPushButton#SuccessAction {{ border-left: 2px solid {COLORS['success']}; }}
QPushButton#IconButton {{
    background-color: {COLORS['panel_elevated']};
    border: 1px solid {COLORS['border_light']};
    border-radius: 10px;
    padding: 12px;
    min-width: 48px;
    max-width: 48px;
    min-height: 48px;
    max-height: 48px;
}}
QPushButton#IconButton:hover {{
    background-color: {COLORS['accent_primary']};
    border-color: {COLORS['accent_primary']};
}}

/* --- INPUTS --- */
QLineEdit, QComboBox, QSpinBox {{
    background-color: {COLORS['panel_highlight']};
    border: 1px solid {COLORS['border']};
    border-radius: 8px;
    padding: 10px;
    color: {COLORS['text_main']};
    font-family: 'Consolas', monospace;
}}
QLineEdit:focus, QComboBox:focus, QSpinBox:focus {{
    border: 2px solid {COLORS['accent_primary']};
    background-color: {COLORS['panel_elevated']};
}}
QComboBox::drop-down {{
    border: none;
    padding-right: 8px;
}}
QComboBox QAbstractItemView {{
    background-color: {COLORS['panel']};
    color: {COLORS['text_main']};
    border: 1px solid {COLORS['border']};
    selection-background-color: {COLORS['accent_primary']};
    selection-color: white;
    padding: 4px;
}}

/* --- GROUP BOX --- */
QGroupBox {{
    border: 1px solid {COLORS['border']};
    border-radius: 10px;
    margin-top: 1.5em;
    padding: 18px 12px 12px 12px;
    font-weight: bold;
    color: {COLORS['text_dim']};
    background-color: {COLORS['panel']};
}}
QGroupBox::title {{ subcontrol-origin: margin; left: 12px; padding: 0 8px; }}

/* --- TERMINAL --- */
QTextEdit {{
    background-color: {COLORS['panel_highlight']};
    border: 1px solid {COLORS['border']};
    border-radius: 10px;
    color: {COLORS['text_main']};
    font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
    font-size: 12px;
    selection-background-color: {COLORS['accent_primary']};
    padding: 8px;
}}

/* --- SLIDER --- */
QSlider::groove:horizontal {{
    border: none;
    height: 6px;
    background: {COLORS['panel_highlight']};
    border-radius: 3px;
}}
QSlider::handle:horizontal {{
    background: {COLORS['accent_primary']};
    border: 2px solid {COLORS['accent_secondary']};
    width: 18px;
    height: 18px;
    margin: -6px 0;
    border-radius: 9px;
}}
QSlider::handle:horizontal:hover {{
    background: {COLORS['accent_secondary']};
}}
"""

    def load_scenario(self):
        key = self.menu_scenario.currentData()
        if key and BACKEND_LOADED:
            # Reset system first
            self.reset_system()

            # Load scenario
            scenario = ScenarioGenerator.load_scenario(self.graph_manager, key)

            if scenario:
                self.log("=" * 50, "cmd")
                self.log(f"SCENARIO LOADED: {scenario['name']}", "cmd")
                self.log(f"{scenario['description']}", "info")
                self.log("=" * 50, "cmd")

                # Log processes created
                self.log("Processes created:", "success")
                for name, pid in scenario['processes'].items():
                    self.log(f"  {name} = {pid}", "info")

                # Log resources created
                self.log("Resources created:", "success")
                for name, rid in scenario['resources'].items():
                    r_info = self.graph_manager.resource_instances[rid]
                    self.log(f"  {name} = {rid} ({r_info['total']} instances)", "info")

                self.log("", "info")
                self.log("Instructions:", "cmd")
                for instruction in scenario['instructions']:
                    self.log(f"  • {instruction}", "info")

                # Execute auto commands if any
                if scenario.get('auto_commands'):
                    self.log("", "info")
                    self.log("Auto-executing setup commands...", "warning")
                    for cmd_data in scenario['auto_commands']:
                        if len(cmd_data) >= 3:
                            cmd_type, arg1, arg2 = cmd_data[0], cmd_data[1], cmd_data[2]
                            if cmd_type == 'wait':
                                status, msg = self.graph_manager.allocate_resource(arg1, arg2)
                                self.log(f"wait {arg1} {arg2}: {msg}", "success" if status == "success" else "warning")
                            elif cmd_type == 'signal':
                                success, msg = self.graph_manager.release_resource(arg1, arg2)
                                self.log(f"signal {arg1} {arg2}: {msg}", "success" if success else "error")

                self.update_graph_view()
                self.log("", "info")
                self.log("Scenario loaded! Click 'Start Simulation' to begin.", "success")
            else:
                self.log("Failed to load scenario.", "error")
            # Reset dropdown to default
            self.menu_scenario.setCurrentIndex(0)
        elif not BACKEND_LOADED:
            self.log("Backend not loaded - cannot load scenarios", "error")
            self.menu_scenario.setCurrentIndex(0)

    def on_algorithm_changed(self, text):
        mapping = {"First Come First Serve": "FCFS", "Shortest Job First": "SJF", "Round Robin": "RR"}
        self.graph_manager.set_scheduler(mapping.get(text, "FCFS"), self.quantum_value)
        self.log(f"Scheduler: {text}", "cmd")

    def on_quantum_changed(self, val):
        self.graph_manager.set_scheduler(self.graph_manager.scheduler_mode, val)

    def toggle_resources_panel(self):
        """Toggle resources panel visibility and redistribute space"""
        is_visible = self.res_scroll.isVisible()
        self.res_scroll.setVisible(not is_visible)
        self.res_empty_label.setVisible(is_visible)  # Show empty label when collapsed

        # Update toggle button icon
        self.btn_toggle_resources.setText("▼" if not is_visible else "▲")

        # Adjust stretch factors for dynamic space distribution
        if not is_visible:
            # When expanded, give resources panel space
            self.stats_col.setStretchFactor(self.queue_card, 1)
            self.stats_col.setStretchFactor(self.mon_card, 1)
            self.stats_col.setStretchFactor(self.mem_card, 1)
        else:
            # When collapsed, redistribute space to queue and memory
            self.stats_col.setStretchFactor(self.queue_card, 1)
            self.stats_col.setStretchFactor(self.mon_card, 0)
            self.stats_col.setStretchFactor(self.mem_card, 1)

    def toggle_sidebar(self):
        """Toggle sidebar visibility with smooth animation"""
        self.sidebar_visible = not self.sidebar_visible
        if self.sidebar_visible:
            self.sidebar.show()
            self.sidebar_toggle_btn.setText("☰")
        else:
            self.sidebar.hide()
            self.sidebar_toggle_btn.setText("☰")
        self.log(f"Sidebar {'shown' if self.sidebar_visible else 'hidden'}", "info")

    def keyPressEvent(self, event):
        """Handle keyboard shortcuts"""
        if event.key() == Qt.Key_B and event.modifiers() == Qt.ControlModifier:
            self.toggle_sidebar()
        else:
            super().keyPressEvent(event)

if __name__ == '__main__':
    # Fix High DPI scaling
    os.environ["QT_AUTO_SCREEN_SCALE_FACTOR"] = "1"
    app = QApplication(sys.argv)
    app.setStyle('Fusion')

    # Global Palette for standard widgets
    palette = QPalette()
    palette.setColor(QPalette.Window, QColor(COLORS['bg']))
    palette.setColor(QPalette.WindowText, Qt.white)
    palette.setColor(QPalette.Base, QColor(COLORS['panel']))
    palette.setColor(QPalette.AlternateBase, QColor(COLORS['panel_highlight']))
    palette.setColor(QPalette.ToolTipBase, Qt.white)
    palette.setColor(QPalette.ToolTipText, Qt.white)
    palette.setColor(QPalette.Text, Qt.white)
    palette.setColor(QPalette.Button, QColor(COLORS['panel']))
    palette.setColor(QPalette.ButtonText, Qt.white)
    palette.setColor(QPalette.BrightText, Qt.red)
    palette.setColor(QPalette.Link, QColor(COLORS['accent_primary']))
    palette.setColor(QPalette.Highlight, QColor(COLORS['accent_primary']))
    palette.setColor(QPalette.HighlightedText, Qt.black)
    app.setPalette(palette)

    window = ResourceAllocationSimulator()
    window.show()
    sys.exit(app.exec_())
