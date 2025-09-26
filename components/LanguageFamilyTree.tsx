/**
 * Interactive Language Family Tree Visualization (Polished Rewrite)
 * - Better link rendering, spacing, and centering
 * - Persistent yellow pulse highlight on selected node
 * - Detail panel navigation (←/→, evolved from/into) syncs tree + centers & highlights
 * - Same props / basic data flow
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import { languageVisualizationService, LanguageNode } from '../services/languageVisualizationService';
import { LANGUAGES } from '../constants/gameData/languages';
import { X, ZoomIn, ZoomOut, Maximize2, Search, Clock, Globe, BookOpen, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';

interface LanguageFamilyTreeProps {
  isOpen: boolean;
  onClose: () => void;
  initialLanguageId?: string;
  currentYear?: number;
}

interface WikipediaContent {
  extract: string;
  extract_html?: string;
  thumbnail?: { source: string; width: number; height: number };
  content_urls?: { desktop: { page: string } };
  description?: string;
}

export function LanguageFamilyTree({
  isOpen,
  onClose,
  initialLanguageId,
  currentYear = 1500,
}: LanguageFamilyTreeProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // D3 refs we need across effects
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const gRootRef = useRef<d3.Selection<SVGGElement, unknown, null, undefined> | null>(null);
  const nodesLayoutRef = useRef<d3.HierarchyPointNode<any> | null>(null);
  const nodeSelRef = useRef<d3.Selection<SVGGElement, any, SVGGElement, unknown> | null>(null);
  const selectionOverlayRef = useRef<d3.Selection<SVGGElement, unknown, null, undefined> | null>(null);

  const [selectedNode, setSelectedNode] = useState<LanguageNode | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'tree' | 'timeline' | 'geographic'>('tree');
  const [zoom, setZoom] = useState(1);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; html: string } | null>(null);
  const [wikipediaContent, setWikipediaContent] = useState<WikipediaContent | null>(null);
  const [wikipediaLoading, setWikipediaLoading] = useState(false);

  // === Visual system
  const FAMILY_COLORS: Record<string, string> = useMemo(
    () => ({
      'Indo-European': '#3b82f6',
      'Sino-Tibetan': '#ef4444',
      'Afro-Asiatic': '#f59e0b',
      'Niger-Congo': '#16a34a',
      'Austronesian': '#8b5cf6',
      'Dravidian': '#f97316',
      'Turkic': '#14b8a6',
      'Mongolic': '#334155',
      'Uralic': '#0ea5e9',
      'Algonquian': '#a855f7',
      'Language Isolate': '#94a3b8',
      'Tungusic': '#ea580c',
      'Japonic': '#dc2626',
      'Kartvelian': '#22c55e',
      'Nilo-Saharan': '#eab308',
      'Pidgin': '#cbd5e1',
    }),
    []
  );
  const getFamilyColor = useCallback(
    (family: string) => FAMILY_COLORS[family] || '#64748b',
    [FAMILY_COLORS]
  );

  // Initial selection
  useEffect(() => {
    if (initialLanguageId && !selectedNode) {
      const details = languageVisualizationService.getLanguageDetails(initialLanguageId);
      if (details) setSelectedNode(details);
    }
  }, [initialLanguageId, selectedNode]);

  // Wikipedia fetch on selection
  useEffect(() => {
    (async () => {
      if (!selectedNode || selectedNode.isRoot || String(selectedNode.id).startsWith('family_')) return;

      setWikipediaContent(null);
      setWikipediaLoading(true);
      const cacheKey = `wikipedia_${selectedNode.name}_language`;
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed.timestamp && Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
            setWikipediaContent(parsed.content);
            setWikipediaLoading(false);
            return;
          }
        }
      } catch {}

      try {
        const articleTitle = `${selectedNode.name}_language`;
        const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(articleTitle)}`);
        if (res.ok) {
          const data = await res.json();
          setWikipediaContent(data);
          try {
            localStorage.setItem(cacheKey, JSON.stringify({ content: data, timestamp: Date.now() }));
          } catch {}
        } else {
          setWikipediaContent(null);
        }
      } catch {
        setWikipediaContent(null);
      }
      setWikipediaLoading(false);
    })();
  }, [selectedNode]);

  // Escape closes, Enter searches
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Enter' && searchQuery) handleSearch();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose, searchQuery]);

  // Force rebuild on resize
  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(() => setViewMode((m) => (m === 'tree' ? 'tree' : m)));
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // === Core render
  useEffect(() => {
    if (!isOpen || !svgRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Safe SVG defaults
    svg.attr('width', '100%').attr('height', '100%').attr('viewBox', `0 0 ${container.clientWidth || 1200} ${container.clientHeight || 800}`);

    const width = container.clientWidth || 1200;
    const height = container.clientHeight || 800;

    const gRoot = svg.append('g');
    gRootRef.current = gRoot;

    // Add a <style> block for the yellow pulse animation (works in SVG)
    const styleEl = svg
      .append('style')
      .text(`
        @keyframes pulse-yellow {
          0% { transform: scale(1); opacity: .85; }
          50% { transform: scale(1.25); opacity: .15; }
          100% { transform: scale(1); opacity: .85; }
        }
        .pulse-ring {
          transform-origin: center;
          animation: pulse-yellow 1.2s ease-in-out infinite;
        }
      `);

    // Zoom behavior
    const zoomBehavior = d3.zoom<SVGSVGElement, unknown>().scaleExtent([0.35, 5]).on('zoom', (event) => {
      gRoot.attr('transform', event.transform.toString());
      setZoom(event.transform.k);
    });
    svg.call(zoomBehavior as any);
    zoomBehaviorRef.current = zoomBehavior;

    // Defs: gradients + glow (robust id + fallback)
    const defs = svg.append('defs');
    Object.entries(FAMILY_COLORS).forEach(([family, color]) => {
      const id = `grad-${family.replace(/[^a-z0-9]+/gi, '').toLowerCase()}`;
      const grad = defs.append('linearGradient').attr('id', id).attr('gradientUnits', 'userSpaceOnUse');
      grad.append('stop').attr('offset', '0%').attr('stop-color', color).attr('stop-opacity', 0.6);
      grad.append('stop').attr('offset', '100%').attr('stop-color', color).attr('stop-opacity', 0.15);
    });
    const glow = defs.append('filter').attr('id', 'soft-glow');
    glow.append('feGaussianBlur').attr('stdDeviation', 1.25).attr('result', 'coloredBlur');
    const fm = glow.append('feMerge');
    fm.append('feMergeNode').attr('in', 'coloredBlur');
    fm.append('feMergeNode').attr('in', 'SourceGraphic');

    // Data + layout
    const treeData = languageVisualizationService.getLanguageFamilyTree();
    const root = d3.hierarchy(treeData as any);

    // Separation tuned to reduce crowding and avoid label overlap
    const separation = (a: any, b: any) => {
      const depth = Math.max(a.depth, b.depth);
      const siblings = a.parent === b.parent;
      const base = siblings ? 1.0 : 1.2;
      return base + depth * 0.06;
    };

    // Generous size to reduce initial compression; we’ll zoom-to-node as needed
    const layoutSize: [number, number] =
      viewMode === 'timeline'
        ? [height * 2.4, width * 6]
        : viewMode === 'geographic'
        ? [height * 3.2, width * 3]
        : [height * 5, width * 3];

    const layout = d3.tree<LanguageNode>().size(layoutSize).separation(separation);
    const nodesLayout = layout(root);
    nodesLayoutRef.current = nodesLayout;

    // Custom timeline positioning if needed
    if (viewMode === 'timeline') {
      const descendants = nodesLayout
        .descendants()
        .filter((d) => !d.data.isRoot && !String(d.data.id).startsWith('family_'));
      const minYear = -4000;
      const maxYear = 2025;
      const timelineWidth = width * 4.2;
      const timeScale = d3.scaleLinear().domain([minYear, maxYear]).range([0, timelineWidth]);
      descendants.forEach((n) => {
        const start = n.data.period?.[0] ?? 0;
        const end = n.data.period?.[1] ?? 2025;
        const mid = (start + end) / 2;
        const familyIndex = Object.keys(FAMILY_COLORS).indexOf(n.data.family);
        n.y = timeScale(mid);
        n.x = (familyIndex >= 0 ? familyIndex : 0) * 90 + (Math.random() * 48 - 24);
      });
      const axisG = gRoot.append('g').attr('class', 'timeline-axis').attr('transform', 'translate(0, 16)');
      axisG.append('line').attr('x1', 0).attr('y1', 0).attr('x2', width * 4.2).attr('y2', 0).attr('stroke', '#e5e7eb').attr('stroke-width', 2);
      const ticks: number[] = [];
      for (let y = -4000; y <= 2000; y += 1000) ticks.push(y);
      [2025].forEach((y) => ticks.push(y));
      const group = axisG.selectAll('.tick').data(ticks).enter().append('g').attr('class', 'tick').attr('transform', (d) => `translate(${timeScale(d)},0)`);
      group.append('line').attr('y1', -6).attr('y2', 6).attr('stroke', '#64748b');
      group
        .append('text')
        .attr('y', -10)
        .attr('text-anchor', 'middle')
        .attr('font-size', 12)
        .attr('fill', '#475569')
        .text((d) => (d < 0 ? `${Math.abs(d)} BCE` : `${d} CE`));
    }

    // --- Links (draw first so nodes are on top)
    const linkGen = d3.linkHorizontal<any, any>().x((d: any) => d.y).y((d: any) => d.x);
    const links = nodesLayout.links();

    const linksG = gRoot.append('g').attr('class', 'links');
    linksG
      .selectAll('path')
      .data(links)
      .enter()
      .append('path')
      .attr('d', linkGen as any)
      .attr('fill', 'none')
      .attr('stroke', (d: any) => {
        const gradId = `grad-${String(d.target.data.family).replace(/[^a-z0-9]+/gi, '').toLowerCase()}`;
        // Fallback if gradient is missing for any reason
        return defs.select(`#${gradId}`).empty() ? getFamilyColor(d.target.data.family) : `url(#${gradId})`;
      })
      .attr('stroke-width', (d: any) => Math.min(3, 1 + (d.target.data.children?.length || 0) * 0.22))
      .attr('opacity', 0.7)
      .attr('filter', 'url(#soft-glow)');

    // --- Nodes
    const nodeG = gRoot
      .append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(nodesLayout.descendants())
      .enter()
      .append('g')
      .attr('transform', (d: any) => `translate(${d.y},${d.x})`);

    nodeSelRef.current = nodeG as any;

    // Larger invisible hit area helps hover/click
    nodeG.append('rect').attr('x', -16).attr('y', -16).attr('width', 32).attr('height', 32).attr('fill', 'transparent');

    nodeG
      .append('circle')
      .attr('r', (d: any) => {
        if (d.data.isRoot) return 15;
        if (String(d.data.id).startsWith('family_')) return 12;
        if (!d.data.parent) return 9;
        return d.data.isExtinct ? 6 : 8;
      })
      .attr('fill', (d: any) => d.data.color || getFamilyColor(d.data.family))
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 2)
      .attr('filter', 'url(#soft-glow)')
      .style('cursor', 'pointer')
      .on('mouseenter', function (event: MouseEvent, d: any) {
        d3.select(this).transition().duration(120).attr('r', (r: any) => {
          const base = Number(d3.select(this).attr('r')) || 8;
          return base * 1.25;
        });

        const node = d.data as LanguageNode;
        let content = `<div style="font-weight:700;font-size:14px;letter-spacing:.2px;color:${node.color || getFamilyColor(node.family)}">${node.name}</div>`;
        if (node.nativeName) content += `<div style="opacity:.85">${node.nativeName}</div>`;
        if (node.period && !node.isRoot && !String(node.id).startsWith('family_')) {
          const fmt = (y?: number) => (y === undefined ? '' : y < 0 ? `${Math.abs(y)} BCE` : y === 2025 ? 'Present' : `${y} CE`);
          content += `<div style="color:#f59e0b;margin-top:4px">⏰ ${fmt(node.period[0])} → ${fmt(node.period[1])}</div>`;
        }
        if (node.regions?.length) content += `<div style="color:#38bdf8;margin-top:2px">📍 ${node.regions.slice(0, 3).join(', ')}</div>`;
        if (node.isExtinct) content += `<div style="color:#ef4444;margin-top:2px">† Extinct</div>`;
        if (node.isReconstructed) content += `<div style="color:#8b5cf6;margin-top:2px">* Reconstructed</div>`;
        setTooltip({ x: event.pageX + 10, y: event.pageY - 10, html: content });
      })
      .on('mousemove', (event: MouseEvent) => setTooltip((t) => (t ? { ...t, x: event.pageX + 10, y: event.pageY - 10 } : t)))
      .on('mouseleave', function () {
        d3.select(this)
          .transition()
          .duration(120)
          .attr('r', (d: any) => {
            if (d.data.isRoot) return 15;
            if (String(d.data.id).startsWith('family_')) return 12;
            if (!d.data.parent) return 9;
            return d.data.isExtinct ? 6 : 8;
          });
        setTooltip(null);
      })
      .on('click', (_event: MouseEvent, d: any) => setSelectedNode(d.data as LanguageNode));

    // Labels
    nodeG
      .append('text')
      .attr('dx', (d: any) => (d.data.isRoot || String(d.data.id).startsWith('family_') ? 0 : d.children ? -12 : 12))
      .attr('dy', (d: any) => (d.data.isRoot || String(d.data.id).startsWith('family_') ? -20 : 3))
      .attr('text-anchor', (d: any) => (d.data.isRoot || String(d.data.id).startsWith('family_') ? 'middle' : d.children ? 'end' : 'start'))
      .attr('font-size', (d: any) => (d.data.isRoot ? 20 : String(d.data.id).startsWith('family_') ? 16 : 13))
      .attr('font-weight', (d: any) => (d.data.isRoot || String(d.data.id).startsWith('family_') ? 700 : 500))
      .attr('fill', (d: any) => (d.data.isExtinct ? '#6b7280' : d.data.isRoot || String(d.data.id).startsWith('family_') ? '#0f172a' : '#1f2937'))
      .style('paint-order', 'stroke')
      .style('stroke', '#ffffff')
      .style('stroke-width', 3)
      .style('stroke-linejoin', 'round')
      .style('cursor', 'pointer')
      .text((d: any) => {
        const n = d.data as LanguageNode;
        return String(n.id).startsWith('family_') ? n.name : n.name.length > 22 ? `${n.name.slice(0, 22)}…` : n.name;
      })
      .on('click', (_e: MouseEvent, d: any) => setSelectedNode(d.data as LanguageNode));

    // Annotations
    nodeG
      .filter((d: any) => d.data.isExtinct && !d.data.isRoot && !String(d.data.id).startsWith('family_'))
      .append('text')
      .attr('dx', -6)
      .attr('dy', -12)
      .attr('font-size', 15)
      .attr('font-weight', 700)
      .attr('fill', '#dc2626')
      .style('paint-order', 'stroke')
      .style('stroke', '#fff')
      .style('stroke-width', 2)
      .text('†');

    nodeG
      .filter((d: any) => d.data.isReconstructed)
      .append('text')
      .attr('dx', -6)
      .attr('dy', 16)
      .attr('font-size', 15)
      .attr('font-weight', 700)
      .attr('fill', '#7c3aed')
      .style('paint-order', 'stroke')
      .style('stroke', '#fff')
      .style('stroke-width', 2)
      .text('*');

   //
// Selection overlay (stable yellow pulse, no CSS transform)
//
const selectionOverlay = gRoot.append('g').attr('class', 'selection-overlay');
selectionOverlayRef.current = selectionOverlay;

// helper: start an infinite pulse on a given (x,y) with a base radius
const startPulse = (cx: number, cy: number, baseR: number) => {
  // Clear previous selection visuals
  selectionOverlay.selectAll('*').remove();

  // Static soft halo (stays put)
  selectionOverlay
    .append('circle')
    .attr('cx', cx)
    .attr('cy', cy)
    .attr('r', baseR + 6)
    .attr('fill', 'none')
    .attr('stroke', '#fde047') // yellow-300
    .attr('stroke-width', 3)
    .attr('opacity', 0.55)
    .attr('filter', 'url(#soft-glow)');

  // Animated outward pulse (D3 loop; no transform animation)
  const ring = selectionOverlay
    .append('circle')
    .attr('cx', cx)
    .attr('cy', cy)
    .attr('r', baseR + 8)
    .attr('fill', 'none')
    .attr('stroke', '#facc15') // yellow-400
    .attr('stroke-width', 3)
    .attr('opacity', 0.7)
    .attr('filter', 'url(#soft-glow)');

  const loop = () => {
    ring
      .attr('r', baseR + 8)
      .attr('opacity', 0.7)
      .transition()
      .duration(1200)
      .ease(d3.easeCubicInOut)
      .attr('r', baseR + 20)
      .attr('opacity', 0)
      .on('end', loop);
  };
  loop();
};

// helper: compute visual radius for a node datum
const nodeBaseRadius = (d: any) => {
  if (d.data.isRoot) return 15;
  if (String(d.data.id).startsWith('family_')) return 12;
  if (!d.data.parent) return 10;
  return d.data.isExtinct ? 6 : 8;
};

// Helper: center on node by id with padding & start pulse
const centerOnNode = (targetId: string, opts?: { duration?: number; scale?: number }) => {
  const nodes = nodesLayoutRef.current;
  if (!nodes || !svgRef.current || !zoomBehaviorRef.current || !nodeSelRef.current) return;

  const target = nodes.descendants().find((n: any) => String(n.data.id) === String(targetId));
  if (!target) return;

  const svg = d3.select(svgRef.current);
  const vw = container.clientWidth || 1200;
  const vh = container.clientHeight || 800;

  // choose a comfortable scale so label has breathing room
  const desiredNodeRadius = nodeBaseRadius({ data: target.data });
  const scale =
    opts?.scale ??
    Math.min(2, Math.max(1.25, Math.min(vw, vh) / (desiredNodeRadius * 24)));

  // precise centering (layout uses x vertical, y horizontal)
  const tx = vw / 2 - target.y * scale;
  const ty = vh / 2 - target.x * scale;

  svg
    .transition()
    .duration(opts?.duration ?? 650)
    .call(zoomBehaviorRef.current.transform, d3.zoomIdentity.translate(tx, ty).scale(scale));

  // start/refresh pulse on the target
  startPulse(target.y, target.x, desiredNodeRadius);
};

// Initial overview or jump to initialLanguageId
if (initialLanguageId) {
  // Ensure the DOM is ready; then center and pulse
  requestAnimationFrame(() => centerOnNode(initialLanguageId, { duration: 800 }));
} else {
  const t = d3.zoomIdentity.translate(width * 0.2, height * 0.5).scale(0.9);
  svg.call(zoomBehavior.transform as any, t);
}

// Expose helper so other effects can reuse it
(centerOnNodeRef as any).current = centerOnNode;




    return () => {
      styleEl.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, viewMode, FAMILY_COLORS, getFamilyColor, initialLanguageId]);

  // Keep a ref to center function
  const centerOnNodeRef = useRef<(id: string, opts?: { duration?: number; scale?: number }) => void>(() => {});

  // Search
  const handleSearch = useCallback(() => {
    if (!searchQuery.trim()) return;
    const results = languageVisualizationService.searchLanguages(searchQuery.trim());
    if (results.length) setSelectedNode(results[0]);
  }, [searchQuery]);

  // Navigation helpers using service (safer than manual walk)
  const findPredecessor = useCallback(
    (languageId: string): LanguageNode | null => languageVisualizationService.getPrimaryPredecessor(languageId),
    []
  );
  const findSuccessor = useCallback(
    (languageId: string): LanguageNode | null => languageVisualizationService.getPrimarySuccessor(languageId),
    []
  );



useEffect(() => {
  if (!isOpen || !selectedNode) return;
  if (selectedNode.isRoot || String(selectedNode.id).startsWith('family_')) return;
  const center = (centerOnNodeRef as any).current as (id: string, opts?: { duration?: number; scale?: number }) => void;
  if (center) center(selectedNode.id, { duration: 650 });
}, [isOpen, selectedNode]);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm" aria-modal="true" role="dialog">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-[95vw] max-w-7xl h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-700 to-slate-800 text-white px-5 py-4 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-3">
            <BookOpen className="w-6 h-6" aria-hidden />
            <div className="flex flex-col">
              <h2 className="text-xl font-semibold tracking-tight">Interactive Language Family Tree</h2>
              <span className="text-xs text-white/80">{currentYear < 0 ? `${Math.abs(currentYear)} BCE` : `${currentYear} CE`}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* View toggles */}
            <div className="flex items-center bg-white/10 rounded-xl p-1 ring-1 ring-white/20">
              <button
                onClick={() => setViewMode('tree')}
                className={`px-3 py-1.5 rounded-lg text-sm transition-all ${viewMode === 'tree' ? 'bg-white text-slate-900 shadow' : 'text-white hover:bg-white/10'}`}
                aria-pressed={viewMode === 'tree'}
              >
                Tree
              </button>
              <button
                onClick={() => setViewMode('timeline')}
                className={`px-3 py-1.5 rounded-lg text-sm transition-all flex items-center gap-1 ${
                  viewMode === 'timeline' ? 'bg-white text-slate-900 shadow' : 'text-white hover:bg-white/10'
                }`}
                aria-pressed={viewMode === 'timeline'}
              >
                <Clock className="w-4 h-4" aria-hidden /> Timeline
              </button>
              <button
                onClick={() => setViewMode('geographic')}
                className={`px-3 py-1.5 rounded-lg text-sm transition-all flex items-center gap-1 ${
                  viewMode === 'geographic' ? 'bg-white text-slate-900 shadow' : 'text-white hover:bg-white/10'
                }`}
                aria-pressed={viewMode === 'geographic'}
              >
                <Globe className="w-4 h-4" aria-hidden /> Geographic
              </button>
            </div>

            {/* Search */}
            <div className="flex items-center bg-white/10 rounded-xl px-3 py-1.5 ring-1 ring-white/20">
              <Search className="w-4 h-4 mr-2 text-white/80" aria-hidden />
              <input
                type="text"
                placeholder="Search languages…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="bg-transparent outline-none placeholder-white/70 text-white text-sm w-44"
                aria-label="Search languages"
              />
            </div>

            <button
              onClick={onClose}
              className="hover:bg-white/10 rounded-xl p-2 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex min-h-0">
          {/* Viz */}
          <div ref={containerRef} className="flex-1 relative bg-gradient-to-br from-slate-50 via-white to-blue-50">
            <svg ref={svgRef} className="w-full h-full [cursor:grab]" />

            {/* Zoom controls */}
            <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-10">
              <button
                onClick={() => {
                  if (!zoomBehaviorRef.current || !svgRef.current) return;
                  const svg = d3.select(svgRef.current);
                  svg.transition().duration(500).call(zoomBehaviorRef.current.scaleBy, 1.25);
                }}
                className="bg-white/95 backdrop-blur border border-slate-200 shadow-lg rounded-xl p-2 hover:bg-slate-50 transition"
                aria-label="Zoom in"
              >
                <ZoomIn className="w-5 h-5 text-slate-700" />
              </button>
              <button
                onClick={() => {
                  if (!zoomBehaviorRef.current || !svgRef.current) return;
                  const svg = d3.select(svgRef.current);
                  svg.transition().duration(500).call(zoomBehaviorRef.current.scaleBy, 0.8);
                }}
                className="bg-white/95 backdrop-blur border border-slate-200 shadow-lg rounded-xl p-2 hover:bg-slate-50 transition"
                aria-label="Zoom out"
              >
                <ZoomOut className="w-5 h-5 text-slate-700" />
              </button>
              <button
                onClick={() => {
                  if (!zoomBehaviorRef.current || !svgRef.current || !containerRef.current) return;
                  const svg = d3.select(svgRef.current);
                  const width = containerRef.current.clientWidth || 1200;
                  const height = containerRef.current.clientHeight || 800;
                  const t = d3.zoomIdentity.translate(width * 0.2, height * 0.4).scale(0.9);
                  svg.transition().duration(500).call(zoomBehaviorRef.current.transform, t);
                }}
                className="bg-white/95 backdrop-blur border border-slate-200 shadow-lg rounded-xl p-2 hover:bg-slate-50 transition"
                title="Reset zoom"
                aria-label="Reset zoom"
              >
                <Maximize2 className="w-5 h-5 text-slate-700" />
              </button>
              <div className="bg-white/95 backdrop-blur border border-slate-200 shadow-lg rounded-xl px-3 py-1 text-xs font-medium text-slate-700 text-center">
                {Math.round(zoom * 100)}%
              </div>
            </div>

            {/* Legend */}
            <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur rounded-xl shadow-lg p-3 border border-slate-200 z-10 max-h-48 overflow-y-auto w-56">
              <div className="text-xs font-semibold text-slate-800 mb-2 tracking-wide">Language Families</div>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(FAMILY_COLORS).slice(0, 10).map(([family, color]) => (
                  <div key={family} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full border border-slate-300 shadow-sm" style={{ backgroundColor: color }} />
                    <span className="text-[11px] text-slate-700 truncate" title={family}>
                      {family}
                    </span>
                  </div>
                ))}
              </div>
              <div className="border-t border-slate-200 mt-2 pt-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-red-600 font-bold">†</span>
                  <span className="text-[11px] text-slate-700">Extinct</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-purple-600 font-bold">*</span>
                  <span className="text-[11px] text-slate-700">Reconstructed</span>
                </div>
              </div>
            </div>

            {/* Tooltip */}
            {tooltip && (
              <div
                className="pointer-events-none fixed z-[10000] rounded-lg border border-slate-200 bg-white/95 backdrop-blur px-3 py-2 shadow-xl"
                style={{ left: tooltip.x, top: tooltip.y, maxWidth: 320 }}
                dangerouslySetInnerHTML={{ __html: tooltip.html }}
              />
            )}
          </div>

          {/* Details Panel */}
          {selectedNode && !selectedNode.isRoot && !String(selectedNode.id).startsWith('family_') && (() => {
            const fullLanguageData = LANGUAGES[selectedNode.id];
            const badgeColor = getFamilyColor(selectedNode.family);
            const fmtYear = (y?: number) => (y === undefined ? '' : y < 0 ? `${Math.abs(y)} BCE` : y === 2025 ? 'Present' : `${y} CE`);

            return (
              <aside className="w-96 bg-gradient-to-b from-slate-50 to-slate-100 border-l border-slate-200 shadow-inner flex flex-col h-full">
                {/* Panel Header */}
                <div className="sticky top-0 border-b border-slate-300/70 p-4" style={{ background: `linear-gradient(90deg, ${badgeColor}, #64748b)` }}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <h3 className="text-2xl font-semibold leading-tight text-white tracking-tight truncate">{selectedNode.name}</h3>
                      {selectedNode.nativeName && <p className="text-sm text-slate-200 mt-1 truncate">{selectedNode.nativeName}</p>}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {(() => {
                        const pred = findPredecessor(selectedNode.id);
                        return pred ? (
                          <button
                            onClick={() => setSelectedNode(pred)}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            title={`Previous: ${pred.name}`}
                            aria-label="Go to predecessor"
                          >
                            <ChevronLeft className="w-5 h-5 text-white" />
                          </button>
                        ) : (
                          <div className="w-9 h-9" />
                        );
                      })()}
                      {(() => {
                        const succ = findSuccessor(selectedNode.id);
                        return succ ? (
                          <button
                            onClick={() => setSelectedNode(succ)}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            title={`Next: ${succ.name}`}
                            aria-label="Go to successor"
                          >
                            <ChevronRight className="w-5 h-5 text-white" />
                          </button>
                        ) : (
                          <div className="w-9 h-9" />
                        );
                      })()}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-white/90 text-slate-900 shadow-sm" title="Language family">
                      {selectedNode.family}
                    </span>
                    {selectedNode.isExtinct && <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">† Extinct</span>}
                    {selectedNode.isReconstructed && <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">* Reconstructed</span>}
                    <a
                      href={`https://en.wikipedia.org/wiki/${encodeURIComponent(selectedNode.name)}_language`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors flex items-center gap-1"
                      title={`View ${selectedNode.name} on Wikipedia`}
                    >
                      <ExternalLink className="w-3 h-3" />
                      Wikipedia
                    </a>
                  </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {/* Time Period */}
                  {selectedNode.period && (
                    <section className="bg-white rounded-xl p-3 shadow-sm border border-slate-200">
                      <h4 className="font-semibold text-slate-800 mb-1 flex items-center tracking-tight">
                        <Clock className="w-4 h-4 mr-2 text-blue-600" aria-hidden /> Time Period
                      </h4>
                      <div className="text-slate-700">
                        <span className="font-medium">{fmtYear(selectedNode.period[0])}</span>
                        <span className="mx-2 text-slate-400">→</span>
                        <span className="font-medium">{fmtYear(selectedNode.period[1])}</span>
                      </div>
                      <div className="text-xs text-slate-500 mt-1">Duration: {Math.abs((selectedNode.period?.[1] ?? 0) - (selectedNode.period?.[0] ?? 0))} years</div>
                    </section>
                  )}

                  {/* Description */}
                  {selectedNode.description && (
                    <section className="bg-white rounded-xl p-3 shadow-sm border border-slate-200">
                      <h4 className="font-semibold text-slate-800 mb-1 tracking-tight">Description</h4>
                      <p className="text-slate-700 text-sm leading-relaxed">{selectedNode.description}</p>
                    </section>
                  )}

                  {/* Historical Context */}
                  {selectedNode.historicalContext && (
                    <section className="bg-white rounded-xl p-3 shadow-sm border border-slate-200">
                      <h4 className="font-semibold text-slate-800 mb-1 tracking-tight">Historical Context</h4>
                      <p className="text-slate-700 text-sm leading-relaxed">{selectedNode.historicalContext}</p>
                    </section>
                  )}

                  {/* Regions */}
                  {selectedNode.regions?.length ? (
                    <section className="bg-white rounded-xl p-3 shadow-sm border border-slate-200">
                      <h4 className="font-semibold text-slate-800 mb-1 flex items-center tracking-tight">
                        <Globe className="w-4 h-4 mr-2 text-emerald-600" aria-hidden /> Geographic Regions
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedNode.regions.map((r) => (
                          <span key={r} className="px-2 py-1 rounded bg-emerald-50 text-emerald-700 text-xs border border-emerald-100">
                            {r}
                          </span>
                        ))}
                      </div>
                    </section>
                  ) : null}

                  {/* Script */}
                  {selectedNode.script && (
                    <section className="bg-white rounded-xl p-3 shadow-sm border border-slate-200">
                      <h4 className="font-semibold text-slate-800 mb-1 flex items-center tracking-tight">
                        <BookOpen className="w-4 h-4 mr-2 text-violet-600" aria-hidden /> Writing System
                      </h4>
                      <p className="text-slate-700 text-sm">{Array.isArray(selectedNode.script) ? selectedNode.script.join(', ') : selectedNode.script}</p>
                    </section>
                  )}

                  {/* Relationships */}
                  {(fullLanguageData?.predecessors || fullLanguageData?.successors) && (
                    <section className="bg-white rounded-xl p-3 shadow-sm border border-slate-200">
                      <h4 className="font-semibold text-slate-800 mb-3 tracking-tight">Language Evolution</h4>

                      {fullLanguageData.predecessors?.length ? (
                        <div className="mb-3">
                          <h5 className="text-[13px] font-medium text-slate-700 mb-2">Evolved from:</h5>
                          <div className="space-y-1">
                            {fullLanguageData.predecessors.map((pid: string) => {
                              const pred = LANGUAGES[pid];
                              if (!pred) return null;
                              return (
                                <button
                                  key={pid}
                                  onClick={() => {
                                    const n = languageVisualizationService.getLanguageDetails(pid);
                                    if (n) setSelectedNode(n);
                                  }}
                                  className="block w-full text-left px-3 py-2 bg-slate-50 hover:bg-slate-100 rounded-md text-sm transition-colors"
                                >
                                  <span className="font-medium text-slate-900">{pred.name}</span>
                                  {pred.nativeName && <span className="text-slate-500 ml-2">({pred.nativeName})</span>}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ) : null}

                      {fullLanguageData.successors?.length ? (
                        <div>
                          <h5 className="text-[13px] font-medium text-slate-700 mb-2">Evolved into:</h5>
                          <div className="space-y-1">
                            {fullLanguageData.successors.map((sid: string) => {
                              const succ = LANGUAGES[sid];
                              if (!succ) return null;
                              return (
                                <button
                                  key={sid}
                                  onClick={() => {
                                    const n = languageVisualizationService.getLanguageDetails(sid);
                                    if (n) setSelectedNode(n);
                                  }}
                                  className="block w-full text-left px-3 py-2 bg-slate-50 hover:bg-slate-100 rounded-md text-sm transition-colors"
                                >
                                  <span className="font-medium text-slate-900">{succ.name}</span>
                                  {succ.nativeName && <span className="text-slate-500 ml-2">({succ.nativeName})</span>}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ) : null}
                    </section>
                  )}

                  {/* Phrases */}
                  {selectedNode.greetings && Object.keys(selectedNode.greetings).length > 0 && (
                    <section className="bg-white rounded-xl p-3 shadow-sm border border-slate-200">
                      <h4 className="font-semibold text-slate-800 mb-2 tracking-tight">Common Phrases</h4>
                      <div className="grid grid-cols-1 gap-2">
                        {Object.entries(selectedNode.greetings).map(([k, v]) => (
                          <div key={k} className="flex items-center justify-between py-2 border-b last:border-b-0 border-slate-200">
                            <span className="text-slate-600 capitalize text-sm">{k}:</span>
                            <span className="text-slate-900 font-medium text-sm">{String(v)}</span>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Linguistic Notes */}
                  {fullLanguageData?.llmPrompt && (
                    <section className="bg-amber-50 rounded-xl p-3 border border-amber-200">
                      <h4 className="font-semibold text-amber-900 mb-1 tracking-tight">Linguistic Characteristics</h4>
                      <p className="text-amber-900/90 text-sm leading-relaxed">{fullLanguageData.llmPrompt}</p>
                    </section>
                  )}

                  {/* Wikipedia Content */}
                  {(wikipediaContent || wikipediaLoading) && (
                    <section className="bg-blue-50 rounded-xl p-3 border border-blue-200">
                      <h4 className="font-semibold text-blue-900 mb-2 tracking-tight flex items-center">
                        <Globe className="w-4 h-4 mr-2" aria-hidden />
                        Wikipedia Summary
                      </h4>
                      {wikipediaLoading ? (
                        <div className="flex items-center gap-2 text-blue-700">
                          <div className="w-4 h-4 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin"></div>
                          <span className="text-sm">Loading Wikipedia content...</span>
                        </div>
                      ) : wikipediaContent ? (
                        <div className="space-y-3">
                          {wikipediaContent.description && <p className="text-blue-800 text-sm font-medium italic">{wikipediaContent.description}</p>}
                          <p className="text-blue-900/90 text-sm leading-relaxed">{wikipediaContent.extract}</p>
                          {wikipediaContent.thumbnail && (
                            <div className="mt-3">
                              <img
                                src={wikipediaContent.thumbnail.source}
                                alt={`Illustration related to ${selectedNode.name}`}
                                className="w-full max-w-xs rounded-lg shadow-sm border border-blue-200"
                                style={{ maxHeight: '200px', objectFit: 'cover' }}
                              />
                            </div>
                          )}
                          {wikipediaContent.content_urls?.desktop?.page && (
                            <div className="pt-2 border-t border-blue-200">
                              <a
                                href={wikipediaContent.content_urls.desktop.page}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-700 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
                              >
                                <ExternalLink className="w-3 h-3" />
                                Read full article on Wikipedia
                              </a>
                            </div>
                          )}
                        </div>
                      ) : null}
                    </section>
                  )}
                </div>
              </aside>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
