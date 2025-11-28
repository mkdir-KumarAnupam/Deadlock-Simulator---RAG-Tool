import sys
from PyQt5.QtWidgets import QApplication
from ui import ResourceAllocationSimulator

if __name__ == "__main__":
    app = QApplication(sys.argv)
    window = ResourceAllocationSimulator()
    window.show()
    # Use exec_() for PyQt5 compatibility
    sys.exit(app.exec_())
