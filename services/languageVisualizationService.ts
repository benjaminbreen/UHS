/**
 * Language Visualization Service
 * Builds robust tree data structures and relationships for language family visualization
 * - Handles multiple predecessors by choosing a single "primary" parent for the tree
 * - Protects against cycles / duplicate insertions during subtree builds
 * - Adds fast navigation helpers (predecessor/successor/ancestors/descendants/path)
 * - Works even if a family is missing from the palette (auto-creates family buckets)
 */

import { LANGUAGES, LanguageData } from '../constants/gameData/languages';

export interface LanguageNode {
  id: string;
  name: string;
  nativeName?: string;
  family: string;
  period: [number, number];
  script?: string | string[];
  regions?: string[];
  isRoot?: boolean;
  isExtinct?: boolean;
  isReconstructed?: boolean;
  color?: string;
  children?: LanguageNode[];
  parent?: string; // primary parent in the tree
  greetings?: any;
  description?: string;
  historicalContext?: string;
}

export interface LanguageLink {
  source: string;
  target: string;
  type: 'evolution' | 'influence' | 'substrate';
  strength?: number;
}

/** Color palette for language families (fallbacks added dynamically for unknown families) */
const FAMILY_COLORS: Record<string, string> = {
  'Indo-European': '#4A90E2',
  'Sino-Tibetan': '#E74C3C',
  'Afro-Asiatic': '#F39C12',
  'Niger-Congo': '#27AE60',
  'Austronesian': '#9B59B6',
  'Dravidian': '#E67E22',
  'Turkic': '#1ABC9C',
  'Mongolic': '#34495E',
  'Uralic': '#16A085',
  'Algonquian': '#8E44AD',
  'Language Isolate': '#95A5A6',
  'Tungusic': '#D35400',
  'Japonic': '#C0392B',
  'Kartvelian': '#2ECC71',
  'Nilo-Saharan': '#F1C40F',
  'Pidgin': '#BDC3C7',
};

type Id = string;

type BuildMaps = {
  byId: Map<Id, LanguageNode>;
  // all parents (possibly multiple) as declared in source data
  allParents: Map<Id, Id[]>;
  // chosen single "primary parent" for each node (to form a tree)
  primaryParent: Map<Id, Id>;
  // forward edge map (children by id) based on primaryParent
  childrenOf: Map<Id, Id[]>;
  // evolution links for rendering (only primary edges so the D3 tree remains a tree)
  primaryLinks: LanguageLink[];
  // optional non-primary links for future reference (influence/substrate/etc.)
  secondaryLinks: LanguageLink[];
  // family color cache (augmented with fallbacks)
  familyColor: Map<string, string>;
};

class LanguageVisualizationService {
  private maps: BuildMaps;

  constructor() {
    this.maps = this.buildAll();
  }

  /** Public: rebuild everything (call if LANGUAGES changes at runtime) */
  public refresh(): void {
    this.maps = this.buildAll();
  }

  /** COLOR UTIL */
  public getFamilyColor(family: string): string {
    const c = this.maps.familyColor.get(family);
    if (c) return c;
    return '#95A5A6';
  }

  /** CORE LOOKUPS */
  public getLanguageDetails(id: Id): LanguageNode | undefined {
    return this.maps.byId.get(id);
  }

  public getLanguageLinks(): LanguageLink[] {
    return this.maps.primaryLinks.slice();
  }

  /** Optional: all links (primary + secondary). Primary are tree edges; secondary are extra. */
  public getAllLinks(): LanguageLink[] {
    return [...this.maps.primaryLinks, ...this.maps.secondaryLinks];
  }

  /** Search by name/native/regions */
  public searchLanguages(query: string): LanguageNode[] {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const results: LanguageNode[] = [];
    this.maps.byId.forEach((n) => {
      if (
        n.name.toLowerCase().includes(q) ||
        (n.nativeName && n.nativeName.toLowerCase().includes(q)) ||
        (n.regions && n.regions.some((r) => r.toLowerCase().includes(q)))
      ) {
        results.push(n);
      }
    });
    return results;
  }

  /** Languages active in a specific year */
  public getLanguagesByYear(year: number): LanguageNode[] {
    const out: LanguageNode[] = [];
    this.maps.byId.forEach((n) => {
      if (year >= n.period[0] && year <= n.period[1]) out.push(n);
    });
    return out;
  }

  /** Quick stats */
  public getFamilyStats(): Map<string, number> {
    const counts = new Map<string, number>();
    this.maps.byId.forEach((n) => {
      const f = n.family;
      counts.set(f, (counts.get(f) ?? 0) + 1);
    });
    return counts;
  }

  /** NAV HELPERS (for detail panel arrows, keyboard nav, etc.) */

  /** The primary predecessor (single parent used to form the tree) */
  public getPrimaryPredecessor(id: Id): LanguageNode | null {
    const pid = this.maps.primaryParent.get(id);
    return pid ? this.maps.byId.get(pid) ?? null : null;
  }

  /** All declared predecessors (can be multiple in your data model) */
  public getAllPredecessors(id: Id): LanguageNode[] {
    const preds = this.maps.allParents.get(id) ?? [];
    return preds.map((pid) => this.maps.byId.get(pid)).filter(Boolean) as LanguageNode[];
  }

  /** Primary successor (first child; useful for simple "next" button semantics) */
  public getPrimarySuccessor(id: Id): LanguageNode | null {
    const kids = this.maps.childrenOf.get(id) ?? [];
    return kids.length ? (this.maps.byId.get(kids[0]) ?? null) : null;
  }

  /** All successors (children) */
  public getSuccessors(id: Id): LanguageNode[] {
    const kids = this.maps.childrenOf.get(id) ?? [];
    return kids.map((cid) => this.maps.byId.get(cid)).filter(Boolean) as LanguageNode[];
  }

  /** Path from a node to the root following primary parents */
  public getPathToRoot(id: Id): LanguageNode[] {
    const path: LanguageNode[] = [];
    let cur: Id | undefined = id;
    const guard = new Set<Id>();
    while (cur && !guard.has(cur)) {
      guard.add(cur);
      const node = this.maps.byId.get(cur);
      if (!node) break;
      path.push(node);
      const p = this.maps.primaryParent.get(cur);
      cur = p;
    }
    return path;
  }

  /** All ancestors (primary chain) up to an optional depth limit */
  public getAncestors(id: Id, depthLimit = Infinity): LanguageNode[] {
    const path = this.getPathToRoot(id);
    // path includes the node itself as first element; exclude it
    return path.slice(1, Math.min(path.length, depthLimit + 1));
  }

  /** All descendants (primary tree) with an optional depth limit */
  public getDescendants(id: Id, depthLimit = Infinity): LanguageNode[] {
    const out: LanguageNode[] = [];
    const queue: Array<{ id: Id; depth: number }> = [{ id, depth: 0 }];
    const seen = new Set<Id>();

    while (queue.length) {
      const { id: cur, depth } = queue.shift()!;
      if (seen.has(cur)) continue;
      seen.add(cur);

      if (depth > 0) {
        const node = this.maps.byId.get(cur);
        if (node) out.push(node);
      }
      if (depth >= depthLimit) continue;

      const kids = this.maps.childrenOf.get(cur) ?? [];
      for (const k of kids) queue.push({ id: k, depth: depth + 1 });
    }
    return out;
  }

  /**
   * Get the complete language family tree (root + family buckets + nested primary lineage)
   * NOTE: This returns a *fresh* object graph each call to keep D3 mutations local to the viz.
   */
  public getLanguageFamilyTree(): LanguageNode {
    const root: LanguageNode = {
      id: 'root',
      name: 'World Languages',
      family: 'root',
      period: [-10000, 2025],
      isRoot: true,
      children: [],
    };

    // Build a bucket node per family encountered (use dynamic family list from data)
    const familiesEncountered = new Set<string>();
    this.maps.byId.forEach((n) => {
      if (n.family) familiesEncountered.add(n.family);
    });

    const familyBuckets = new Map<string, LanguageNode>();
    familiesEncountered.forEach((fam) => {
      const bucket: LanguageNode = {
        id: `family_${fam}`,
        name: fam,
        family: fam,
        period: [-10000, 2025],
        color: this.getFamilyColor(fam),
        children: [],
      };
      familyBuckets.set(fam, bucket);
      root.children!.push(bucket);
    });

    // Find "roots" for each family: nodes with no primary parent
    const topLevelByFamily = new Map<string, LanguageNode[]>();
    this.maps.byId.forEach((n) => {
      if (n.id === 'root') return;
      if (n.family && !this.maps.primaryParent.has(n.id)) {
        const arr = topLevelByFamily.get(n.family) ?? [];
        arr.push(n);
        topLevelByFamily.set(n.family, arr);
      }
    });

    // Build subtrees (primary lineage only) with cycle/dup guards
    const buildSubtree = (nodeId: Id, seen: Set<Id>): LanguageNode => {
      const base = this.maps.byId.get(nodeId)!;
      const clone: LanguageNode = { ...base, children: [] };

      if (seen.has(nodeId)) return clone; // cycle guard (shouldn't happen, but safe)
      seen.add(nodeId);

      const kids = this.maps.childrenOf.get(nodeId) ?? [];
      for (const kidId of kids) {
        const childClone = buildSubtree(kidId, seen);
        clone.children!.push(childClone);
      }
      return clone;
    };

    // Attach top-level roots to family buckets
    topLevelByFamily.forEach((roots, fam) => {
      const bucket = familyBuckets.get(fam);
      if (!bucket) return;
      const seen = new Set<Id>();
      for (const r of roots) {
        bucket.children!.push(buildSubtree(r.id, seen));
      }
    });

    // For languages that somehow didn't get attached (e.g., missing family info), attach to a generic bucket
    const attachedIds = new Set<Id>();
    const markAttached = (n: LanguageNode) => {
      attachedIds.add(n.id);
      n.children?.forEach(markAttached);
    };
    root.children?.forEach(markAttached);

    this.maps.byId.forEach((n) => {
      if (!attachedIds.has(n.id) && n.id !== 'root') {
        const fam = n.family || 'Uncategorized';
        if (!familyBuckets.has(fam)) {
          const bucket: LanguageNode = {
            id: `family_${fam}`,
            name: fam,
            family: fam,
            period: [-10000, 2025],
            color: this.getFamilyColor(fam),
            children: [],
          };
          familyBuckets.set(fam, bucket);
          root.children!.push(bucket);
        }
        // place as a singleton child in its family bucket
        const clone: LanguageNode = { ...n, children: [] };
        familyBuckets.get(fam)!.children!.push(clone);
      }
    });

    return root;
  }

  /** Distance heuristic with primary-ancestor awareness */
  public getLinguisticDistance(id1: Id, id2: Id): number {
    const a = this.maps.byId.get(id1);
    const b = this.maps.byId.get(id2);
    if (!a || !b) return 1.0;
    if (id1 === id2) return 0;

    if (a.family === b.family) {
      if (this.isPrimaryAncestor(id1, id2) || this.isPrimaryAncestor(id2, id1)) return 0.3;
      return 0.5;
    }
    return 1.0;
  }

  /** True if ancestorId is a primary-line ancestor of descendantId */
  private isPrimaryAncestor(ancestorId: Id, descendantId: Id): boolean {
    let cur: Id | undefined = descendantId;
    const guard = new Set<Id>();
    while (cur && !guard.has(cur)) {
      guard.add(cur);
      if (cur === ancestorId) return true;
      cur = this.maps.primaryParent.get(cur);
    }
    return false;
  }

  // =========================
  // ===== BUILD PHASE =======
  // =========================

  private buildAll(): BuildMaps {
    const byId: Map<Id, LanguageNode> = new Map();
    const familyColor: Map<string, string> = new Map(Object.entries(FAMILY_COLORS));
    const allParents: Map<Id, Id[]> = new Map();
    const primaryParent: Map<Id, Id> = new Map();
    const childrenOf: Map<Id, Id[]> = new Map();
    const primaryLinks: LanguageLink[] = [];
    const secondaryLinks: LanguageLink[] = [];

    // 1) Create nodes
    Object.values(LANGUAGES).forEach((lang) => {
      // normalize
      const period: [number, number] = [
        Array.isArray(lang.period) ? Number(lang.period[0]) : (lang as any).period?.[0] ?? -10000,
        Array.isArray(lang.period) ? Number(lang.period[1]) : (lang as any).period?.[1] ?? 2025,
      ];
      const fam = lang.family || 'Uncategorized';
      if (!familyColor.has(fam)) {
        // create a deterministic pastel fallback color for unknown family names
        familyColor.set(fam, this.hashColor(fam));
      }

      const node: LanguageNode = {
        id: lang.id,
        name: lang.name,
        nativeName: lang.nativeName,
        family: fam,
        period,
        script: lang.script,
        regions: lang.regions,
        isExtinct: period[1] < 2000, // simple heuristic; tweak if you have a better flag
        isReconstructed: lang.isReconstructed,
        color: familyColor.get(fam),
        greetings: (lang as any).greetings,
        description: (lang as any).description,
        historicalContext: (lang as any).historicalContext,
        children: [],
      };
      byId.set(lang.id, node);
    });

    // 2) Record all declared predecessors per node
    Object.values(LANGUAGES).forEach((lang) => {
      const preds = (lang.predecessors ?? []).filter((p) => byId.has(p));
      if (preds.length) allParents.set(lang.id, preds);
    });

    // 3) Choose a single primary parent to enforce a *tree* for D3’s tree layout
    //    Strategy: pick the predecessor whose end date is closest to (but <=) the child’s start date;
    //    otherwise fall back to the first predecessor.
    const choosePrimary = (childId: Id, preds: Id[]): Id => {
      const child = byId.get(childId)!;
      const childStart = child.period[0];

      let best: { pid: Id; score: number } | null = null;
      for (const pid of preds) {
        const p = byId.get(pid);
        if (!p) continue;
        const parentEnd = p.period[1];
        // Preference to parents that end before/at child start, closer is better
        // If none qualify, still choose the closest end date overall
        const baseScore = Math.abs((parentEnd ?? 0) - childStart);
        const penalty = parentEnd > childStart ? 0.25 : 0; // slight penalty if parent ends after child begins
        const score = baseScore + penalty;
        if (!best || score < best.score) best = { pid, score };
      }
      return best ? best.pid : preds[0];
    };

    allParents.forEach((preds, childId) => {
      if (!preds.length) return;
      const primary = choosePrimary(childId, preds);
      primaryParent.set(childId, primary);
    });

    // 4) Build forward children map for primary edges
    primaryParent.forEach((p, c) => {
      const arr = childrenOf.get(p) ?? [];
      arr.push(c);
      childrenOf.set(p, arr);
    });

    // 5) Build links: primary edges for the tree; (optional) secondary edges if multiple preds
    byId.forEach((_node, id) => {
      const primary = primaryParent.get(id);
      if (primary) {
        primaryLinks.push({ source: primary, target: id, type: 'evolution', strength: 1.0 });
      }
      const preds = allParents.get(id) ?? [];
      if (preds.length > 1) {
        // make the non-primary ones "influence" links (kept separate from the tree)
        preds.forEach((pid) => {
          if (pid !== primary) {
            secondaryLinks.push({ source: pid, target: id, type: 'influence', strength: 0.5 });
          }
        });
      }
    });

    // 6) Stamp primary parent into node.parent for convenience
    primaryParent.forEach((p, c) => {
      const child = byId.get(c);
      if (child) child.parent = p;
    });

    return { byId, allParents, primaryParent, childrenOf, primaryLinks, secondaryLinks, familyColor };
  }

  /** Deterministic fallback color for unknown families */
  private hashColor(key: string): string {
    // Simple hash -> HSL pastel
    let h = 0;
    for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
    const hue = h % 360;
    const sat = 45 + (h % 20); // 45–64
    const light = 60 + (h % 10); // 60–69
    // Convert to hex roughly via a tiny HSL->RGB
    const hex = this.hslToHex(hue, sat / 100, light / 100);
    return hex;
  }

  private hslToHex(h: number, s: number, l: number): string {
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) => {
      const k = (n + h / 30) % 12;
      const c = l - a * Math.max(-1, Math.min(k - 3, Math.min(9 - k, 1)));
      return Math.round(255 * c);
    };
    return `#${[f(0), f(8), f(4)]
      .map((v) => v.toString(16).padStart(2, '0'))
      .join('')}`;
  }
}

// Export singleton instance
export const languageVisualizationService = new LanguageVisualizationService();

/** Also export FAMILY_COLORS if you want the UI to share this canonical palette */
export { FAMILY_COLORS };
