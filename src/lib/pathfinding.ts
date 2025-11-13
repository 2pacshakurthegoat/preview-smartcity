import { Position, Road, RoadStatus } from '@/types/simulation';

interface PathNode {
  position: Position;
  g: number; // Cost from start
  h: number; // Heuristic to end
  f: number; // Total cost
  parent: PathNode | null;
}

// Manhattan distance heuristic
const heuristic = (a: Position, b: Position): number => {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
};

// Get road cost based on status
const getRoadCost = (status: RoadStatus): number => {
  switch (status) {
    case 'open': return 1;
    case 'congested': return 3;
    case 'blocked': return 999; // Very high cost, but not impossible
  }
};

// Find road between two positions
const findRoad = (from: Position, to: Position, roads: Road[]): Road | null => {
  return roads.find(road => 
    (road.from.x === from.x && road.from.y === from.y && 
     road.to.x === to.x && road.to.y === to.y) ||
    (road.to.x === from.x && road.to.y === from.y && 
     road.from.x === to.x && road.from.y === to.y)
  ) || null;
};

// Get neighbors of a position
const getNeighbors = (pos: Position, gridSize: number, roads: Road[]): Array<{ position: Position; cost: number }> => {
  const neighbors: Array<{ position: Position; cost: number }> = [];
  const directions = [
    { x: 0, y: 1 },   // Up
    { x: 1, y: 0 },   // Right
    { x: 0, y: -1 },  // Down
    { x: -1, y: 0 },  // Left
  ];

  for (const dir of directions) {
    const newPos: Position = {
      x: pos.x + dir.x,
      y: pos.y + dir.y,
    };

    // Check bounds
    if (newPos.x >= 0 && newPos.x < gridSize && newPos.y >= 0 && newPos.y < gridSize) {
      const road = findRoad(pos, newPos, roads);
      if (road) {
        neighbors.push({
          position: newPos,
          cost: getRoadCost(road.status),
        });
      }
    }
  }

  return neighbors;
};

// A* pathfinding algorithm
export const findPath = (
  start: Position,
  goal: Position,
  gridSize: number,
  roads: Road[]
): Position[] | null => {
  // Round positions to grid coordinates
  const startPos: Position = {
    x: Math.round(start.x),
    y: Math.round(start.y),
  };
  const goalPos: Position = {
    x: Math.round(goal.x),
    y: Math.round(goal.y),
  };

  // If start equals goal, return empty path
  if (startPos.x === goalPos.x && startPos.y === goalPos.y) {
    return [goalPos];
  }

  const openList: PathNode[] = [];
  const closedSet = new Set<string>();

  const startNode: PathNode = {
    position: startPos,
    g: 0,
    h: heuristic(startPos, goalPos),
    f: heuristic(startPos, goalPos),
    parent: null,
  };

  openList.push(startNode);

  while (openList.length > 0) {
    // Find node with lowest f score
    openList.sort((a, b) => a.f - b.f);
    const currentNode = openList.shift()!;

    const posKey = `${currentNode.position.x},${currentNode.position.y}`;
    
    // Check if we reached the goal
    if (currentNode.position.x === goalPos.x && currentNode.position.y === goalPos.y) {
      // Reconstruct path
      const path: Position[] = [];
      let node: PathNode | null = currentNode;
      while (node) {
        path.unshift(node.position);
        node = node.parent;
      }
      return path;
    }

    closedSet.add(posKey);

    // Check neighbors
    const neighbors = getNeighbors(currentNode.position, gridSize, roads);
    
    for (const { position: neighborPos, cost } of neighbors) {
      const neighborKey = `${neighborPos.x},${neighborPos.y}`;
      
      if (closedSet.has(neighborKey)) continue;

      const g = currentNode.g + cost;
      const h = heuristic(neighborPos, goalPos);
      const f = g + h;

      // Check if neighbor is already in open list
      const existingNode = openList.find(n => 
        n.position.x === neighborPos.x && n.position.y === neighborPos.y
      );

      if (existingNode) {
        // Update if we found a better path
        if (g < existingNode.g) {
          existingNode.g = g;
          existingNode.f = f;
          existingNode.parent = currentNode;
        }
      } else {
        // Add new node to open list
        openList.push({
          position: neighborPos,
          g,
          h,
          f,
          parent: currentNode,
        });
      }
    }
  }

  // No path found
  return null;
};

// Get next position along the path
export const getNextPosition = (currentPos: Position, path: Position[]): Position | null => {
  if (!path || path.length === 0) return null;
  
  // Find current position in path
  const currentIndex = path.findIndex(p => 
    Math.abs(p.x - currentPos.x) < 0.5 && Math.abs(p.y - currentPos.y) < 0.5
  );

  if (currentIndex === -1) {
    // Not on path, return first waypoint
    return path[0];
  }

  // Return next position if available
  if (currentIndex < path.length - 1) {
    return path[currentIndex + 1];
  }

  // Reached end of path
  return null;
};
