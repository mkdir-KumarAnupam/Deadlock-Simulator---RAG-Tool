import json
import os

class WebExporter:
    @staticmethod
    def export_to_html(graph_manager, filename="resource_graph.html"):
        nodes = []
        edges = []

        # 1. Prepare Nodes
        for node in graph_manager.graph.nodes:
            node_type = "process" if node.startswith("P") else "resource"

            data = {
                "id": node,
                "label": node,
                "shape": "dot" if node_type == "process" else "box",
                "color": "#44b0f2" if node_type == "process" else "#9370DB",
                "font": {"color": "white"}
            }

            if node_type == "resource":
                res_info = graph_manager.resource_instances.get(node, {})
                avail = res_info.get('available', 0)
                total = res_info.get('total', 0)
                data["label"] = f"{node}\n({avail}/{total})"
                data["color"] = "#ff5757" if avail == 0 else "#9370DB"
            elif node_type == "process":
                # Add aging visual to web export
                wait_time = graph_manager.wait_times.get(node, 0)
                if wait_time > 10:
                    data["color"] = "#ff0000" # Red for starving

            nodes.append(data)

        # 2. Prepare Edges
        for u, v in graph_manager.graph.edges:
            edge_type = graph_manager.graph.edges[u, v].get('type', 'normal')
            edge_data = {
                "from": u,
                "to": v,
                "arrows": "to",
                "width": 2
            }

            if edge_type == 'request':
                edge_data["dashes"] = True
                edge_data["color"] = {"color": "orange"}
                edge_data["label"] = "Wait"
            else:
                edge_data["color"] = {"color": "gray"}

            edges.append(edge_data)

        # 3. HTML Template
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>Resource Allocation Graph</title>
            <script type="text/javascript" src="https://unpkg.com/vis-network/standalone/umd/vis-network.min.js"></script>
            <style type="text/css">
                body {{ background-color: #1e1e2e; color: #ffffff; font-family: sans-serif; margin: 0; }}
                #mynetwork {{ width: 100vw; height: 100vh; border: 1px solid #444444; }}
                .legend {{ position: absolute; top: 20px; left: 20px; background: rgba(0,0,0,0.7); padding: 15px; border-radius: 8px; pointer-events: none; }}
                h2 {{ margin-top: 0; }}
            </style>
        </head>
        <body>
            <div id="mynetwork"></div>
            <div class="legend">
                <h2>RAG Simulation</h2>
                <p><span style="color:#44b0f2">●</span> Process</p>
                <p><span style="color:#9370DB">■</span> Resource (Available)</p>
                <p><span style="color:#ff5757">■</span> Resource (Empty)</p>
                <p><span style="color:gray">──</span> Allocation</p>
                <p><span style="color:orange">--</span> Request (Waiting)</p>
            </div>

            <script type="text/javascript">
                var nodes = new vis.DataSet({json.dumps(nodes)});
                var edges = new vis.DataSet({json.dumps(edges)});
                var container = document.getElementById('mynetwork');
                var data = {{ nodes: nodes, edges: edges }};
                var options = {{
                    physics: {{
                        enabled: true,
                        stabilization: {{ iterations: 150 }}
                    }},
                    nodes: {{
                        font: {{ size: 16, face: 'arial' }}
                    }},
                    layout: {{
                        randomSeed: 2
                    }}
                }};
                var network = new vis.Network(container, data, options);
            </script>
        </body>
        </html>
        """

        with open(filename, "w", encoding="utf-8") as f:
            f.write(html_content)

        return os.path.abspath(filename)
