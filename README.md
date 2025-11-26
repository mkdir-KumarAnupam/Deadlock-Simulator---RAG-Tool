# Graphical-Simulator-for-Resource-Allocation-Graphs
This is  a graphical simulator for resource allocation graph consisting both single and multi instance resources with deadlock detection 

# Resource Allocation Graph Simulator

## 📌 Overview
This project is a *Graphical Simulator for Resource Allocation Graphs, designed to **visualize, analyze, and manage resource allocation scenarios. It is useful for understanding **deadlocks* and how processes interact with resources in a system. The simulator allows users to:
- Dynamically *add processes and resources*.
- *Allocate and release resources*.
- *Request unavailable resources* with proper visualization.
- *Automatically handle resource reallocation* when freed.
- *Detect and visualize deadlocks* in real-time.

## 📦 Required Packages
Ensure you have the following dependencies installed before running the project:

bash
pip install PyQt6 networkx matplotlib


### *Dependencies Explained*
- *PyQt6* → Provides the GUI framework to create an interactive desktop application.
- *networkx* → Handles graph operations for managing resource allocation.
- *matplotlib* → Renders the graphical representation of the resource allocation graph.

## 🚀 How to Run

### **Note on simulator.py**
The simulator.py file is an *initial and basic version* of the project. While it is not actively used in the current version, it can serve as a *starting point for custom development* or alternative implementations.
1. *Clone the Repository*
   bash
   git clone <repository_url>
   cd <repository_name>
   
2. *Install Dependencies*
   bash
   pip install -r requirements.txt  # If a requirements file is provided
   
   Or manually install:
   bash
   pip install PyQt6 networkx matplotlib
   
3. *Run the Simulator*
   bash
   python main.py
   

## 🎮 Features
### *1. Dynamic Resource & Process Management*
- *Add Processes* → Dynamically create new processes (P1, P2, etc.).
- *Add Resources* → Define new resources (R1, R2, etc.) with user-specified instances.

### *2. Resource Allocation & Requests*
- *Allocate Resources* → Assign available resources to processes.
- *Request Unavailable Resources* → If a resource is unavailable, the system:
  - Creates an *orange dashed edge* to show the request.
  - Once released, the request *automatically converts into an allocation*.

### *3. Deadlock Detection & Resolution*
- *Detect Deadlocks* → Identifies circular dependencies and warns the user.
- *Visual Deadlock Representation* → Highlights deadlock cycles in the graph.
- *Potential Deadlock Warning* → Detects requests that might cause a deadlock before it happens.

### *4. Automatic Resource Reallocation*
- When a resource is *released from a process, the **first waiting process* gets it *automatically*.
- *Removes orange request edges* and *adds red allocation edges* in real-time.

### *5. Button-Based Interface*
- The simulator *does not use drag-and-drop*.
- Users interact via *buttons* to perform actions such as adding processes, adding resources, allocating, requesting, and releasing resources.
- Clickable options guide users through the simulation efficiently.

### *6. Graphical Representation*
- *Processes* are shown as *circles*.
- *Resources* are shown as *rectangles*.
- *Solid edges (red)* → Show allocations.
- *Dashed edges (orange)* → Show resource requests.
- *Live graph updates* ensure accurate visualization.

## 🖥 Usage Guide
### *Step-by-Step Simulation*
1. *Adding Elements*:
   - Click *Add Process* to create new processes.
   - Click *Add Resource* to create new resources with instances.
2. *Allocating & Requesting Resources*:
   - Click *Allocate/Request* to assign a resource to a process.
   - If the resource is unavailable, an *orange request edge appears*.
3. *Releasing Resources*:
   - Click *Release Resource* to free an allocation.
   - The *first waiting process (if any) automatically gets the resource*.
4. *Checking Deadlocks*:
   - Click *Check Deadlock* to detect *circular dependencies*.
5. *Removing Elements*:
   - Click Remove Process to delete a process and its associated requests.
   - Click Remove Resource to delete a resource and release its allocations.

## 🛠 Future Enhancements
- *Priority-based resource allocation* → Allocate resources based on priority levels.
- *Logging functionality* → Record simulation actions for further analysis.
- *More interactive visualizations* → Improve clarity of allocations and deadlocks.

## 💡 Contribution
Feel free to contribute by *reporting issues, **suggesting improvements, or **submitting pull requests*. Let's improve this tool together! 🚀
