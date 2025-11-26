import sys
import matplotlib
matplotlib.use('QtAgg')
from matplotlib.backends.backend_qt5agg import FigureCanvasQTAgg as FigureCanvas
from matplotlib.figure import Figure
import networkx as nx

from PyQt6.QtWidgets import (QMainWindow, QPushButton, QVBoxLayout, QHBoxLayout,
                             QWidget, QMessageBox, QInputDialog, QLabel,
                             QFrame, QSplitter, QTextEdit, QFileDialog)
from PyQt6.QtCore import Qt, QTimer
from PyQt6.QtGui import QIcon, QFont

from graph_manager import GraphManager
from web_exporter import WebExporter

# --- STYLESHEET ---
DARK_THEME = """
QMainWindow {
    background-color: #2b2b2b;
}
QWidget {
    color: #e0e0e0;
    font-family: 'Segoe UI', Arial, sans-serif;
}
QPushButton {
    background-color: #3d3d3d;
    border: 1px solid #555;
    border-radius: 6px;
    padding: 10px;
    font-size: 13px;
    min-width: 120px;
}
QPushButton:hover {
    background-color: #505050;
    border-color: #44b0f2;
}
QPushButton:pressed {
    background-color: #252525;
}
/* Specific colors for action buttons */
QPushButton#ActionBtn {
    background-color: #2c3e50;
    border-left: 4px solid #3498db;
}
QPushButton#CriticalBtn {
    background-color: #3e2c2c;
    border-left: 4px solid #e74c3c;
}
QPushButton#ExportBtn {
    background-color: #2c3e32;
    border-left: 4px solid #2ecc71;
}
QLabel#Header {
    font-size: 18px;
    font-weight: bold;
    color: #44b0f2;
    padding: 10px;
}
QFrame#SidePanel {
    background-color: #333333;
    border-right: 1px solid #111;
}
QTextEdit {
    background-color: #1e1e1e;
    border: 1px solid #444;
    color: #00ff00;
    font-family: 'Consolas', monospace;
    font-size: 12px;
}
"""

class MplCanvas(FigureCanvas):
    def __init__(self, parent=None, width=5, height=4, dpi=100):
        self.fig = Figure(figsize=(width, height), dpi=dpi)
        self.axes = self.fig.add_subplot(111)
        # Style the plot for dark theme
        self.fig.patch.set_facecolor('#2b2b2b')
        self.axes.set_facecolor('#2b2b2b')
        self.axes.axis('off')
        super(MplCanvas, self).__init__(self.fig)

class ResourceAllocationSimulator(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("RAG Simulator Pro")
        self.setGeometry(100, 100, 1200, 800)
        self.setStyleSheet(DARK_THEME)

        self.graph_manager = GraphManager()
        self.initUI()
        self.update_graph_view()

    def initUI(self):
        # Main Layout using Splitter
        main_splitter = QSplitter(Qt.Orientation.Horizontal)
        self.setCentralWidget(main_splitter)

        # --- LEFT PANEL (CONTROLS) ---
        left_panel = QFrame()
        left_panel.setObjectName("SidePanel")
        left_panel.setMinimumWidth(250)
        left_layout = QVBoxLayout(left_panel)
        left_layout.setSpacing(15)

        # Header
        lbl_title = QLabel("Control Center")
        lbl_title.setObjectName("Header")
        lbl_title.setAlignment(Qt.AlignmentFlag.AlignCenter)
        left_layout.addWidget(lbl_title)

        # Buttons
        self.add_btn("Add Process (+)", self.add_process, left_layout, "ActionBtn")
        self.add_btn("Add Resource (+)", self.add_resource, left_layout, "ActionBtn")
        left_layout.addSpacing(10)
        self.add_btn("Allocate / Request", self.manage_allocation, left_layout, "ActionBtn")
        self.add_btn("Release Resource", self.release_resource, left_layout, "ActionBtn")
        left_layout.addSpacing(10)
        self.add_btn("Analyze Deadlock", self.detect_deadlock, left_layout, "CriticalBtn")
        self.add_btn("Reset System", self.reset_system, left_layout, "CriticalBtn")
        left_layout.addSpacing(20)
        self.add_btn("Export to Webpage", self.export_graph, left_layout, "ExportBtn")

        left_layout.addStretch()

        # --- RIGHT PANEL (GRAPH + LOG) ---
        right_panel = QSplitter(Qt.Orientation.Vertical)

        # Graph Area
        self.canvas = MplCanvas(self, width=8, height=6, dpi=100)
        right_panel.addWidget(self.canvas)

        # Log Area
        self.log_console = QTextEdit()
        self.log_console.setReadOnly(True)
        self.log_console.setMinimumHeight(150)
        self.log("System initialized ready for simulation...", color="white")
        right_panel.addWidget(self.log_console)

        # Add panels to main splitter
        main_splitter.addWidget(left_panel)
        main_splitter.addWidget(right_panel)
        main_splitter.setSizes([300, 900])

    def add_btn(self, text, func, layout, obj_name=None):
        btn = QPushButton(text)
        if obj_name: btn.setObjectName(obj_name)
        btn.clicked.connect(func)
        layout.addWidget(btn)

    def log(self, message, color="#00ff00"):
        self.log_console.append(f'<span style="color:{color}">> {message}</span>')

    # --- LOGIC WRAPPERS ---

    def add_process(self):
        pid = self.graph_manager.add_process()
        self.log(f"Process Created: {pid}")
        self.update_graph_view()

    def add_resource(self):
        qty, ok = QInputDialog.getInt(self, "Add Resource", "Instances:", 1, 1, 50)
        if ok:
            rid = self.graph_manager.add_resource(qty)
            self.log(f"Resource Created: {rid} ({qty} instances)")
            self.update_graph_view()

    def manage_allocation(self):
        procs = [n for n in self.graph_manager.graph.nodes if n.startswith("P")]
        res = [n for n in self.graph_manager.graph.nodes if n.startswith("R")]

        if not procs or not res:
            self.log("Error: Need at least one Process and one Resource", "red")
            return

        p, ok1 = QInputDialog.getItem(self, "Select Process", "Process:", procs, 0, False)
        if not ok1: return
        r, ok2 = QInputDialog.getItem(self, "Select Resource", "Resource:", res, 0, False)
        if not ok2: return

        status, msg = self.graph_manager.allocate_resource(p, r)
        color = "orange" if status == "wait" else "#00ff00"
        self.log(msg, color)
        self.update_graph_view()

    def release_resource(self):
        # Find active allocations
        active_allocs = []
        for p, mapping in self.graph_manager.allocations.items():
            for r, count in mapping.items():
                if count > 0: active_allocs.append(f"{r} -> {p}")

        if not active_allocs:
            self.log("No active allocations to release.", "yellow")
            return

        sel, ok = QInputDialog.getItem(self, "Release", "Select Allocation:", active_allocs, 0, False)
        if ok:
            r, p = sel.split(" -> ")
            success, msg = self.graph_manager.release_resource(r, p)
            self.log(msg, "#00ccff")
            self.update_graph_view()

    def detect_deadlock(self):
        cycle = self.graph_manager.get_deadlock_cycle()
        if cycle:
            self.log(f"DEADLOCK DETECTED! Cycle: {cycle}", "red")
            QMessageBox.critical(self, "Deadlock", f"System is in Deadlock!\nCycle involved: {cycle}")
            self.update_graph_view(highlight_edges=cycle)
        else:
            self.log("System Check: Safe state. No deadlocks.", "#00ff00")
            QMessageBox.information(self, "Safe", "No deadlocks detected.")

    def reset_system(self):
        self.graph_manager = GraphManager()
        self.log("System Reset Complete.", "yellow")
        self.update_graph_view()

    def export_graph(self):
        path, _ = QFileDialog.getSaveFileName(self, "Export Graph", "", "HTML Files (*.html)")
        if path:
            try:
                full_path = WebExporter.export_to_html(self.graph_manager, path)
                self.log(f"Graph exported successfully to: {full_path}", "#2ecc71")
                QMessageBox.information(self, "Success", "Export successful! Open the HTML file in your browser.")
            except Exception as e:
                self.log(f"Export failed: {str(e)}", "red")

    # --- GRAPH RENDERER ---
    def update_graph_view(self, highlight_edges=None):
        self.canvas.axes.clear()

        G = self.graph_manager.graph
        if G.number_of_nodes() == 0:
            self.canvas.draw()
            return

        pos = nx.spring_layout(G, seed=42, k=1.5)  # k controls node spacing

        # Draw Nodes
        procs = [n for n in G.nodes if n.startswith("P")]
        res = [n for n in G.nodes if n.startswith("R")]

        # Process Nodes
        nx.draw_networkx_nodes(G, pos, nodelist=procs, node_color='#44b0f2',
                             node_shape='o', node_size=1500, ax=self.canvas.axes)

        # Resource Nodes (Square)
        nx.draw_networkx_nodes(G, pos, nodelist=res, node_color='#9370DB',
                             node_shape='s', node_size=1500, ax=self.canvas.axes)

        # Labels
        labels = {}
        for n in G.nodes:
            if n.startswith("R"):
                info = self.graph_manager.resource_instances[n]
                labels[n] = f"{n}\n{info['available']}/{info['total']}"
            else:
                labels[n] = n

        nx.draw_networkx_labels(G, pos, labels, font_color='white',
                              font_weight='bold', font_size=9, ax=self.canvas.axes)

        # Draw Edges
        # Standard Allocations (Gray)
        alloc_edges = [(u, v) for u, v in G.edges if G.edges[u, v].get('type') != 'request']
        nx.draw_networkx_edges(G, pos, edgelist=alloc_edges, edge_color='#888888',
                             width=2, arrowsize=20, ax=self.canvas.axes)

        # Requests (Dashed Orange)
        req_edges = [(u, v) for u, v in G.edges if G.edges[u, v].get('type') == 'request']
        nx.draw_networkx_edges(G, pos, edgelist=req_edges, edge_color='orange',
                             style='dashed', width=2, arrowsize=20, ax=self.canvas.axes)

        # Highlight Deadlock (Red)
        if highlight_edges:
            nx.draw_networkx_edges(G, pos, edgelist=highlight_edges, edge_color='#ff3333',
                                 width=4, arrowsize=25, ax=self.canvas.axes)

        self.canvas.draw()
