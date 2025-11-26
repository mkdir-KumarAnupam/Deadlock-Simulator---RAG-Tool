import sys
import os
import cmd
from graph_manager import GraphManager
from web_exporter import WebExporter

# ANSI Color Codes for "Cool" UI
class Colors:
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'

BANNER = f"""{Colors.CYAN}
   _____ _                 _       _       __   __
  / ____(_)               | |     | |      \ \ / /
 | (___  _ _ __ ___  _   _| | __ _| |_ ___  \ V /
  \___ \| | '_ ` _ \| | | | |/ _` | __/ _ \  > <
  ____) | | | | | | | |_| | | (_| | ||  __/ / . \
 |_____/|_|_| |_| |_|\__,_|_|\__,_|\__\___|/_/ \_\

      Resource Allocation Graph Simulator (CLI)
      Type 'help' to see available commands.
{Colors.ENDC}"""

class ResourceCLI(cmd.Cmd):
    intro = BANNER
    prompt = f'{Colors.BOLD}{Colors.BLUE}(SimulateX) > {Colors.ENDC}'

    def __init__(self):
        super().__init__()
        self.gm = GraphManager()

    def do_add_process(self, arg):
        """Add a new process node. Usage: add_process"""
        pid = self.gm.add_process()
        print(f"{Colors.GREEN}[+] Process added: {pid}{Colors.ENDC}")

    def do_add_resource(self, arg):
        """Add a new resource node. Usage: add_resource <count>"""
        try:
            count = int(arg) if arg else 1
            rid = self.gm.add_resource(count)
            print(f"{Colors.GREEN}[+] Resource added: {rid} (Instances: {count}){Colors.ENDC}")
        except ValueError:
            print(f"{Colors.RED}[!] Error: Please provide a valid integer for instances.{Colors.ENDC}")

    def do_alloc(self, arg):
        """Allocate or Request a resource. Usage: alloc <process_id> <resource_id>"""
        args = arg.split()
        if len(args) != 2:
            print(f"{Colors.RED}[!] Usage: alloc <process_id> <resource_id>{Colors.ENDC}")
            return

        pid, rid = args[0].upper(), args[1].upper()
        status, msg = self.gm.allocate_resource(pid, rid)

        if status == "success":
            print(f"{Colors.GREEN}[✓] {msg}{Colors.ENDC}")
        elif status == "wait":
            print(f"{Colors.YELLOW}[!] {msg}{Colors.ENDC}")
        else:
            print(f"{Colors.RED}[X] {msg}{Colors.ENDC}")

    def do_release(self, arg):
        """Release a resource from a process. Usage: release <resource_id> <process_id>"""
        args = arg.split()
        if len(args) != 2:
            print(f"{Colors.RED}[!] Usage: release <resource_id> <process_id>{Colors.ENDC}")
            return

        rid, pid = args[0].upper(), args[1].upper()
        success, msg = self.gm.release_resource(rid, pid)

        if success:
            print(f"{Colors.BLUE}[✓] {msg}{Colors.ENDC}")
        else:
            print(f"{Colors.RED}[X] Failed: {msg}{Colors.ENDC}")

    def do_status(self, arg):
        """Show the current status of the system (Processes, Resources, Allocations)."""
        print(f"\n{Colors.HEADER}--- SYSTEM STATUS ---{Colors.ENDC}")

        # Resources
        print(f"{Colors.BOLD}Resources:{Colors.ENDC}")
        if not any(n.startswith("R") for n in self.gm.graph.nodes):
            print("  (None)")
        for n in self.gm.graph.nodes:
            if n.startswith("R"):
                info = self.gm.resource_instances[n]
                print(f"  {Colors.CYAN}{n}{Colors.ENDC}: {info['available']}/{info['total']} available")

        # Processes & Allocations
        print(f"\n{Colors.BOLD}Processes:{Colors.ENDC}")
        procs = [n for n in self.gm.graph.nodes if n.startswith("P")]
        if not procs:
            print("  (None)")

        for p in procs:
            # Holding
            holding = self.gm.allocations.get(p, {})
            holding_str = ", ".join([f"{k}({v})" for k,v in holding.items()]) if holding else "None"

            # Waiting
            waiting = self.gm.requests.get(p, {})
            waiting_str = ", ".join([f"{k}({v})" for k,v in waiting.items()]) if waiting else "None"

            print(f"  {Colors.BLUE}{p}{Colors.ENDC} | Holding: [{Colors.GREEN}{holding_str}{Colors.ENDC}] | Waiting: [{Colors.YELLOW}{waiting_str}{Colors.ENDC}]")
        print("")

    def do_deadlock(self, arg):
        """Check for deadlocks in the system."""
        cycle = self.gm.get_deadlock_cycle()
        if cycle:
            print(f"\n{Colors.RED}{Colors.BOLD}!!! DEADLOCK DETECTED !!!{Colors.ENDC}")
            print(f"{Colors.RED}Cycle involved: {cycle}{Colors.ENDC}\n")
        else:
            print(f"\n{Colors.GREEN}[✓] System is SAFE. No deadlocks detected.{Colors.ENDC}\n")

    def do_export(self, arg):
        """Export the graph to HTML. Usage: export <filename.html>"""
        filename = arg if arg else "rag_cli_export.html"
        if not filename.endswith(".html"):
            filename += ".html"

        try:
            path = WebExporter.export_to_html(self.gm, filename)
            print(f"{Colors.GREEN}[✓] Successfully exported to: {path}{Colors.ENDC}")
        except Exception as e:
            print(f"{Colors.RED}[!] Export failed: {e}{Colors.ENDC}")

    def do_reset(self, arg):
        """Reset the simulation."""
        self.gm = GraphManager()
        print(f"{Colors.YELLOW}[!] System reset.{Colors.ENDC}")

    def do_exit(self, arg):
        """Exit the CLI."""
        print("Goodbye!")
        return True

    # Aliases
    do_ap = do_add_process
    do_ar = do_add_resource
    do_check = do_deadlock
    do_quit = do_exit

if __name__ == '__main__':
    ResourceCLI().cmdloop()
