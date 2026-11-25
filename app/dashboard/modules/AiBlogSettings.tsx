"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Blog } from "../types";
import { SkeletonLoader } from "../components/SkeletonLoader";
import { Button, HoverBorderGradient, Input, Slider, Tabs, TabsList, TabsTrigger, DropdownMenu, type DropdownItem } from "@/components/ui";
import { CustomSelect } from "../components/CustomSelect";
import { IconDotsHorizontal } from "../components/Icons";
import { customFetch } from "../services/api";
import {
  Zap,
  Calendar,
  RotateCcw,
  Send,
  ShieldCheck,
  Pause,
  Play,
  Clock,
  Cpu,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  AlertCircle,
  Copy,
  History,
  Sliders,
  Check,
} from "lucide-react";

interface AiBlogSettingsProps {
  blogs?: Blog[];
  isLoading?: boolean;
  onNavigateTab?: (page: string) => void;
  showToast?: (msg: string, type?: "success" | "error" | "loading") => void;
  onHeaderChange?: (left: React.ReactNode, right: React.ReactNode) => void;
}

export function AiBlogSettings({
  blogs = [],
  isLoading = false,
  onNavigateTab,
  showToast,
  onHeaderChange,
}: AiBlogSettingsProps) {
  // Navigation / View State
  const [activeTab, setActiveTab] = useState<"controls" | "prompts">("controls");
  const [loading, setLoading] = useState<boolean>(true);

  // Core Scheduling State
  const [scheduleType, setScheduleType] = useState<string>("daily");
  const [blogsPerActiveDay, setBlogsPerActiveDay] = useState<number>(15);
  const [maxGenerationQty, setMaxGenerationQty] = useState<number>(50);
  const [activeWeekdays, setActiveWeekdays] = useState<string[]>([
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
  ]);
  const [intervalDays, setIntervalDays] = useState<number>(2);
  const [weekdayQuantities, setWeekdayQuantities] = useState<Record<string, number>>({
    monday: 20,
    tuesday: 0,
    wednesday: 20,
    thursday: 0,
    friday: 20,
    saturday: 0,
    sunday: 0,
  });
  const [generationTime, setGenerationTime] = useState<string>("09:00");
  const [timezone] = useState<string>("Asia/Kolkata");
  const [autoPublish, setAutoPublish] = useState<boolean>(true);
  const [selectedModel, setSelectedModel] = useState<string>("gemini-3.5-flash-lite");
  const [savingSchedule, setSavingSchedule] = useState(false);

  // Initial loaded config state for tracking dirty changes
  const initialConfigRef = useRef<any>(null);
  const [isDirty, setIsDirty] = useState(false);

  // Forecast & Projections
  const [dynamicPreview, setDynamicPreview] = useState<{
    days: { date: string; dayOfWeek: string; isActive: boolean; quantity: number }[];
    activeDaysCount: number;
    expectedWeeklyTotal: number;
    expectedMonthlyTotal: number;
    estimatedTotalTokens: number;
  } | null>(null);
  const [showCalendarBreakdown, setShowCalendarBreakdown] = useState(false);

  // Automation Master Switch
  const [automationActive, setAutomationActive] = useState<boolean>(true);
  const [togglingAutomation, setTogglingAutomation] = useState(false);

  // Prompt Management Studio State
  const [prompts, setPrompts] = useState<any[]>([]);
  const [selectedPromptId, setSelectedPromptId] = useState<string>("master_brand");
  const [editingSysPrompt, setEditingSysPrompt] = useState<string>("");
  const [editingUsrTemplate, setEditingUsrTemplate] = useState<string>("");
  const [changeSummary, setChangeSummary] = useState<string>("");
  const [promptVersions, setPromptVersions] = useState<any[]>([]);
  const [showVersions, setShowVersions] = useState(false);
  const [savingPrompt, setSavingPrompt] = useState(false);
  const [testingPrompt, setTestingPrompt] = useState(false);
  const [testOutput, setTestOutput] = useState<{ output: string; latency: number; tokens: number } | null>(null);

  // Manual Trigger Modal
  const [showTriggerModal, setShowTriggerModal] = useState(false);
  const [manualBatchQty, setManualBatchQty] = useState(10);
  const [triggeringBatch, setTriggeringBatch] = useState(false);

  const supportedModelsList = [
    { value: "gemini-3.5-flash-lite", label: "Google Gemini 3.5 Flash Lite (Recommended • Ultra-Fast)" },
    { value: "gemini-3-flash-preview", label: "Google Gemini 3 Flash Preview (Frontier Reasoning)" },
    { value: "openai/gpt-oss-120b", label: "Groq LPU: GPT-OSS 120B (High-Speed Fallback)" },
    { value: "meta-llama/llama-3.3-70b-instruct", label: "OpenRouter: LLaMA 3.3 70B (Tertiary)" },
    { value: "qwen/qwen3.8-27b", label: "Groq LPU: Qwen 3.8 27B" },
  ];

  // Fetch Schedule Configuration
  const fetchScheduleConfig = useCallback(async () => {
    try {
      const res = await customFetch("/api/ai/schedule");
      const json = await res.json();
      const s = json.schedule || json.activeSchedule;
      if (json.success && s) {
        const type = s.schedule_type || "daily";
        const dailyQty = s.blogs_per_active_day !== undefined && s.blogs_per_active_day !== null
          ? Number(s.blogs_per_active_day)
          : 15;
        const maxLimit = Number(s.max_daily_generation_limit || s.max_generation_quantity || 50);
        const days = Array.isArray(s.active_weekdays) ? s.active_weekdays : ["monday", "tuesday", "wednesday", "thursday", "friday"];
        const interval = Number(s.interval_days || 2);
        const weekQuantities = s.weekday_quantities || {
          monday: 20, tuesday: 0, wednesday: 20, thursday: 0, friday: 20, saturday: 0, sunday: 0
        };
        const genTime = s.generation_time || "09:00";
        const autoPub = s.auto_publish_to_sanity ?? s.auto_publish ?? true;
        const model = s.groq_model || s.model || "gemini-3.5-flash-lite";
        const active = s.is_active !== undefined ? Boolean(s.is_active) : true;

        setScheduleType(type);
        setBlogsPerActiveDay(dailyQty);
        setMaxGenerationQty(maxLimit);
        setActiveWeekdays(days);
        setIntervalDays(interval);
        setWeekdayQuantities(weekQuantities);
        setGenerationTime(genTime);
        setAutoPublish(autoPub);
        setSelectedModel(model);
        setAutomationActive(active);

        initialConfigRef.current = {
          scheduleType: type,
          blogsPerActiveDay: dailyQty,
          maxGenerationQty: maxLimit,
          activeWeekdays: days,
          intervalDays: interval,
          generationTime: genTime,
          autoPublish: autoPub,
          selectedModel: model,
        };
        setIsDirty(false);
      }
    } catch {
      // silent load fallback
    }
  }, []);

  // Check Dirty State
  useEffect(() => {
    if (!initialConfigRef.current) return;
    const initial = initialConfigRef.current;
    const changed =
      scheduleType !== initial.scheduleType ||
      blogsPerActiveDay !== initial.blogsPerActiveDay ||
      maxGenerationQty !== initial.maxGenerationQty ||
      generationTime !== initial.generationTime ||
      autoPublish !== initial.autoPublish ||
      selectedModel !== initial.selectedModel ||
      intervalDays !== initial.intervalDays ||
      JSON.stringify(activeWeekdays.slice().sort()) !== JSON.stringify(initial.activeWeekdays.slice().sort());

    setIsDirty(changed);
  }, [
    scheduleType,
    blogsPerActiveDay,
    maxGenerationQty,
    generationTime,
    autoPublish,
    selectedModel,
    intervalDays,
    activeWeekdays,
  ]);

  // Fetch 30-Day Dynamic Preview
  const fetchPreview = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        schedule_type: scheduleType,
        blogs_per_active_day: String(blogsPerActiveDay),
        max_daily_limit: String(maxGenerationQty),
        active_weekdays: activeWeekdays.join(","),
        interval_days: String(intervalDays),
        weekday_quantities: JSON.stringify(weekdayQuantities),
      });
      const res = await customFetch(`/api/ai/schedule?preview=30days&${params.toString()}`);
      const json = await res.json();
      if (json.success && json.preview) {
        setDynamicPreview(json.preview);
      }
    } catch {
      // ignore
    }
  }, [scheduleType, blogsPerActiveDay, maxGenerationQty, activeWeekdays, intervalDays, weekdayQuantities]);

  // Fetch Prompts
  const fetchPrompts = useCallback(async () => {
    try {
      const res = await customFetch("/api/ai/prompts");
      const json = await res.json();
      if (json.success && json.prompts) {
        setPrompts(json.prompts);
        const current = json.prompts.find((p: any) => p.id === selectedPromptId) || json.prompts[0];
        if (current) {
          setSelectedPromptId(current.id);
          setEditingSysPrompt(current.system_prompt || "");
          setEditingUsrTemplate(current.user_prompt_template || "");
        }
      }
    } catch {
      // ignore
    }
  }, [selectedPromptId]);

  // Fetch Prompt Version History
  const fetchPromptVersions = useCallback(async (id: string) => {
    try {
      const res = await customFetch(`/api/ai/prompts?view=versions&id=${id}`);
      const json = await res.json();
      if (json.success && json.versions) {
        setPromptVersions(json.versions);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    const loadInitialData = async () => {
      setLoading(true);
      try {
        await Promise.allSettled([fetchScheduleConfig(), fetchPrompts()]);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    loadInitialData();
    return () => {
      mounted = false;
    };
  }, [fetchScheduleConfig, fetchPrompts]);

  // Debounced preview fetch on change
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPreview();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchPreview]);

  useEffect(() => {
    if (selectedPromptId) {
      fetchPromptVersions(selectedPromptId);
    }
  }, [selectedPromptId, fetchPromptVersions]);

  // Handle Save Schedule Configuration
  const handleSaveScheduleConfig = async () => {
    setSavingSchedule(true);
    try {
      const res = await customFetch("/api/ai/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_schedule",
          schedule_type: scheduleType,
          blogs_per_active_day: blogsPerActiveDay,
          max_daily_generation_limit: maxGenerationQty,
          active_weekdays: activeWeekdays,
          interval_days: intervalDays,
          weekday_quantities: weekdayQuantities,
          generation_time: generationTime,
          auto_publish_to_sanity: autoPublish,
          groq_model: selectedModel,
          is_active: automationActive,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast?.("AI Automation Schedule configuration saved!", "success");
        initialConfigRef.current = {
          scheduleType,
          blogsPerActiveDay,
          maxGenerationQty,
          activeWeekdays,
          intervalDays,
          generationTime,
          autoPublish,
          selectedModel,
        };
        setIsDirty(false);
        fetchPreview();
      } else {
        showToast?.(json.message || "Failed to update configuration", "error");
      }
    } catch {
      showToast?.("Error saving schedule configuration", "error");
    } finally {
      setSavingSchedule(false);
    }
  };

  // Toggle Automation Master Switch
  const handleToggleAutomation = async () => {
    setTogglingAutomation(true);
    const nextState = !automationActive;
    try {
      const res = await customFetch("/api/ai/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggle_active",
          is_active: nextState,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setAutomationActive(nextState);
        showToast?.(
          nextState
            ? "AI Automation resumed successfully!"
            : "AI Automation paused.",
          "success"
        );
        fetchPreview();
      } else {
        showToast?.(json.message || "Failed to toggle status", "error");
      }
    } catch {
      showToast?.("Error updating automation state", "error");
    } finally {
      setTogglingAutomation(false);
    }
  };

  // Switch Selected Prompt
  const handleSelectPrompt = (id: string) => {
    setSelectedPromptId(id);
    const p = prompts.find((item) => item.id === id);
    if (p) {
      setEditingSysPrompt(p.system_prompt || "");
      setEditingUsrTemplate(p.user_prompt_template || "");
      setChangeSummary("");
      setTestOutput(null);
    }
  };

  // Save Prompt
  const handleSavePrompt = async () => {
    setSavingPrompt(true);
    try {
      const res = await customFetch("/api/ai/prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save",
          id: selectedPromptId,
          system_prompt: editingSysPrompt,
          user_prompt_template: editingUsrTemplate,
          change_summary: changeSummary || "Updated via Prompt Studio",
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast?.("Prompt updated and new version committed!", "success");
        setChangeSummary("");
        fetchPrompts();
        fetchPromptVersions(selectedPromptId);
      } else {
        showToast?.(json.message || "Failed to save prompt", "error");
      }
    } catch {
      showToast?.("Error saving prompt", "error");
    } finally {
      setSavingPrompt(false);
    }
  };

  // Restore Default Prompt
  const handleRestoreDefaultPrompt = async () => {
    if (!confirm("Are you sure you want to revert to the factory default prompt for this category?")) {
      return;
    }
    try {
      const res = await customFetch("/api/ai/prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "restore_default",
          id: selectedPromptId,
        }),
      });
      const json = await res.json();
      if (json.success && json.prompt) {
        setEditingSysPrompt(json.prompt.system_prompt);
        setEditingUsrTemplate(json.prompt.user_prompt_template);
        showToast?.("Restored factory default prompt template", "success");
        fetchPrompts();
        fetchPromptVersions(selectedPromptId);
      } else {
        showToast?.(json.message || "Failed to restore default", "error");
      }
    } catch {
      showToast?.("Error restoring prompt", "error");
    }
  };

  // Rollback Prompt
  const handleRollbackPrompt = async (versionNumber: number) => {
    if (!confirm(`Rollback this prompt to version v${versionNumber}?`)) return;
    try {
      const res = await customFetch("/api/ai/prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "rollback",
          id: selectedPromptId,
          version_number: versionNumber,
        }),
      });
      const json = await res.json();
      if (json.success && json.prompt) {
        setEditingSysPrompt(json.prompt.system_prompt);
        setEditingUsrTemplate(json.prompt.user_prompt_template);
        showToast?.(`Rolled back to v${versionNumber} successfully!`, "success");
        fetchPrompts();
        fetchPromptVersions(selectedPromptId);
      } else {
        showToast?.(json.message || "Failed to rollback", "error");
      }
    } catch {
      showToast?.("Error rolling back prompt", "error");
    }
  };

  // Test Prompt Execution
  const handleTestPrompt = async () => {
    setTestingPrompt(true);
    setTestOutput(null);
    try {
      const res = await customFetch("/api/ai/prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "test",
          id: selectedPromptId,
          test_variables: {
            title: "10-Minute Video Reels for Jubilee Hills Restaurants",
            category: "Production",
            keywords: "hyderabad restaurant reels, 10 minute video shoot",
          },
        }),
      });
      const json = await res.json();
      if (json.success && json.result) {
        setTestOutput(json.result);
        showToast?.("Test execution completed successfully!", "success");
      } else {
        showToast?.(json.message || "Test prompt execution failed", "error");
      }
    } catch {
      showToast?.("Error testing prompt", "error");
    } finally {
      setTestingPrompt(false);
    }
  };

  // Trigger Manual Batch
  const handleTriggerManualBatch = async () => {
    setTriggeringBatch(true);
    try {
      const res = await customFetch("/api/ai/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "batch-schedule",
          count: manualBatchQty,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast?.(`Queued batch of ${manualBatchQty} articles for creation!`, "success");
        setShowTriggerModal(false);
      } else {
        showToast?.(json.message || "Failed to schedule batch", "error");
      }
    } catch {
      showToast?.("Error queueing batch", "error");
    } finally {
      setTriggeringBatch(false);
    }
  };

  // Insert variable tag into textarea at cursor position
  const insertVariable = (variable: string) => {
    setEditingUsrTemplate((prev) => `${prev} ${variable}`);
    showToast?.(`Inserted ${variable}`, "success");
  };

  // Sync actions with Topbar
  const onHeaderChangeRef = useRef(onHeaderChange);
  useEffect(() => {
    onHeaderChangeRef.current = onHeaderChange;
  });

  const handleSaveScheduleConfigRef = useRef(handleSaveScheduleConfig);
  useEffect(() => {
    handleSaveScheduleConfigRef.current = handleSaveScheduleConfig;
  });

  const handleToggleAutomationRef = useRef(handleToggleAutomation);
  useEffect(() => {
    handleToggleAutomationRef.current = handleToggleAutomation;
  });

  const fetchScheduleConfigRef = useRef(fetchScheduleConfig);
  useEffect(() => {
    fetchScheduleConfigRef.current = fetchScheduleConfig;
  });

  useEffect(() => {
    onHeaderChangeRef.current?.(
      null,
      <>
        {/* Desktop Header Actions (> 768px) */}
        <div className="header-actions-desktop df-g8 al-c">
          <Button
            variant="secondary"
            onClick={() => setShowTriggerModal(true)}
            title="Trigger on-demand batch generation"
          >
            <Zap size={15} />
            <span>Run Batch Now</span>
          </Button>
          <Button
            variant={isDirty ? "primary" : "secondary"}
            onClick={() => handleSaveScheduleConfigRef.current()}
            disabled={savingSchedule}
            className={isDirty ? "relative animate-pulse" : ""}
            title="Save all configuration changes"
          >
            <CheckCircle2 size={15} />
            <span>{savingSchedule ? "Saving..." : isDirty ? "Save Changes" : "Saved"}</span>
          </Button>
        </div>

        {/* Compact / Overflow Header Actions (<= 768px): Save + Secondary Three-Dot Menu */}
        <div className="header-actions-compact df-g8 al-c">
          <Button
            variant={isDirty ? "primary" : "secondary"}
            onClick={() => handleSaveScheduleConfigRef.current()}
            disabled={savingSchedule}
            className={isDirty ? "relative animate-pulse" : ""}
            title="Save all configuration changes"
          >
            <CheckCircle2 size={15} />
            <span>{savingSchedule ? "Saving..." : isDirty ? "Save" : "Saved"}</span>
          </Button>

          <DropdownMenu
            items={[
              {
                label: "Run Batch Now",
                icon: <Zap size={14} className="text-[var(--red)]" />,
                onSelect: () => setShowTriggerModal(true),
              },
              {
                label: automationActive ? "Pause Automation Engine" : "Resume Automation Engine",
                icon: automationActive ? <Pause size={14} /> : <Play size={14} className="text-[var(--green)]" />,
                onSelect: () => handleToggleAutomationRef.current(),
              },
              ...(isDirty
                ? [
                  {
                    label: "Discard Unsaved Changes",
                    icon: <RotateCcw size={14} />,
                    destructive: true,
                    separatorBefore: true,
                    onSelect: () => fetchScheduleConfigRef.current(),
                  },
                ]
                : []),
            ]}
            align="end"
            trigger={
              <Button
                variant="secondary"
                size="icon"
                pill
                className="btn-secondary header-more-btn"
                title="More options"
                aria-label="More options"
              >
                <IconDotsHorizontal size={18} />
              </Button>
            }
          />
        </div>
      </>
    );
  }, [isDirty, savingSchedule, automationActive]);

  useEffect(() => {
    return () => {
      onHeaderChangeRef.current?.(null, null);
    };
  }, []);

  // Background Heartbeat for Autonomous Scheduling
  useEffect(() => {
    if (!automationActive) return;

    let isEvaluating = false;
    const evaluateCron = async () => {
      if (isEvaluating) return;
      isEvaluating = true;
      try {
        const res = await customFetch("/api/ai/schedule", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "evaluate-schedule" }),
        });
        const json = await res.json();
        if (json.success && json.result?.triggered) {
          showToast?.(`AI Automation: ${json.result.message}`, "success");
          fetchPreview();
        }
      } catch {
        // silent
      } finally {
        isEvaluating = false;
      }
    };

    evaluateCron();
    const intervalId = setInterval(evaluateCron, 30000);
    return () => clearInterval(intervalId);
  }, [automationActive, fetchPreview, showToast]);

  const currentPromptObj = useMemo(
    () => prompts.find((p) => p.id === selectedPromptId) || prompts[0] || null,
    [prompts, selectedPromptId]
  );

  if (isLoading || loading) {
    return <SkeletonLoader type="ai-settings" />;
  }

  return (
    <div className="ai-view-container ai-settings-container">
      {/* ─── Master Automation Header Panel with Existing Radix Tabs ─── */}
      <div className="glass-card ai-header-card">
        <div className="ai-header-content">
          <div className="ai-title-group">
            <span
              className={`ai-status-indicator ${automationActive ? "active" : "paused"}`}
            />
            <h2 className="page-section-title">
              AI Blog Automation Engine
            </h2>
            <span className={`badge ${automationActive ? "badge-green" : "badge-gold"}`}>
              {automationActive ? "ACTIVE" : "PAUSED"}
            </span>
            <Button
              variant={automationActive ? "secondary" : "growth"}
              size="sm"
              onClick={handleToggleAutomation}
              disabled={togglingAutomation}
            >
              {automationActive ? (
                <>
                  <Pause size={14} />
                  <span>Pause Engine</span>
                </>
              ) : (
                <>
                  <Play size={14} />
                  <span>Resume Engine</span>
                </>
              )}
            </Button>
          </div>

          <div className="df-g8 al-c ai-header-tabs-wrap">
            <Tabs
              value={activeTab}
              onValueChange={(val) => setActiveTab(val as "controls" | "prompts")}
              className="tabs-full-width"
              fullWidth
            >
              <TabsList shellClassName="tabs-shell-full-width" fullWidth>
                <TabsTrigger value="controls">Schedule Config</TabsTrigger>
                <TabsTrigger value="prompts">Prompt Studio</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </div>

      {/* ─── TAB 1: CADENCE & SCHEDULING ─── */}
      {activeTab === "controls" && (
        <div className="ai-view-container">
          {/* Card 1: Scheduling Mode & Timing */}
          <div className="glass-card ai-settings-card-compact">
            <div className="ai-cadence-header">
              <div>
                <h3 className="ai-cadence-title">
                  Publish Configuration
                </h3>
              </div>
              <div className="ai-cadence-tabs-wrap">
                <Tabs
                  value={scheduleType}
                  onValueChange={(val) => setScheduleType(val)}
                  className="tabs-full-width"
                  fullWidth
                >
                  <TabsList shellClassName="tabs-shell-full-width" fullWidth>
                    <TabsTrigger value="daily">Daily Production</TabsTrigger>
                    <TabsTrigger value="selected_weekdays">Selected Weekdays</TabsTrigger>
                    <TabsTrigger value="every_n_days">Interval Cadence</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>

            {/* Mode Selection with Existing Tab Structure */}


            {/* Mode Specific Configuration */}
            {scheduleType === "selected_weekdays" && (
              <div className="ai-weekdays-box">
                <div className="ai-weekdays-header">
                  <label className="ai-field-label m-0">
                    Active Weekdays
                  </label>
                  <div className="ai-weekdays-presets">
                    <button
                      type="button"
                      className="ai-preset-btn"
                      onClick={() => setActiveWeekdays(["monday", "tuesday", "wednesday", "thursday", "friday"])}
                    >
                      Mon–Fri Only
                    </button>
                    <span className="ai-preset-sep">•</span>
                    <button
                      type="button"
                      className="ai-preset-btn"
                      onClick={() => setActiveWeekdays(["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"])}
                    >
                      All 7 Days
                    </button>
                  </div>
                </div>

                <div className="ai-weekdays-row">
                  {[
                    { id: "monday", label: "Mon" },
                    { id: "tuesday", label: "Tue" },
                    { id: "wednesday", label: "Wed" },
                    { id: "thursday", label: "Thu" },
                    { id: "friday", label: "Fri" },
                    { id: "saturday", label: "Sat" },
                    { id: "sunday", label: "Sun" },
                  ].map((day) => {
                    const isSelected = activeWeekdays.includes(day.id);
                    return (
                      <button
                        key={day.id}
                        type="button"
                        onClick={() => {
                          setActiveWeekdays((prev) =>
                            isSelected ? prev.filter((d) => d !== day.id) : [...prev, day.id]
                          );
                        }}
                        className={`ai-weekday-pill ${isSelected ? "active" : ""}`}
                      >
                        {day.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {scheduleType === "every_n_days" && (
              <div className="ai-interval-box">
                <div>
                  <div className="ai-interval-title">Cadence Interval</div>
                  <div className="ai-interval-desc">
                    Runs once every {intervalDays} calendar days
                  </div>
                </div>

                <div className="ai-interval-controls">
                  {[2, 3, 5, 7].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setIntervalDays(num)}
                      className={`ai-interval-chip ${intervalDays === num ? "active" : ""}`}
                    >
                      Every {num}d
                    </button>
                  ))}
                  <Input
                    type="number"
                    min="1"
                    max="30"
                    value={intervalDays}
                    onChange={(e) => setIntervalDays(Number(e.target.value) || 1)}
                    className="ai-interval-input"
                  />
                </div>
              </div>
            )}

            {/* 3 Core Fields Grid: Target Quota, Time, Max Safety Limit */}
            <div className="ai-timing-grid">
              <div>
                <Slider
                  label="Target Output per Active Day"
                  min={1}
                  max={maxGenerationQty}
                  step={1}
                  value={blogsPerActiveDay}
                  onValueChange={(val) => setBlogsPerActiveDay(typeof val === "number" ? val : val[0])}
                  format={(val) => `${val} blogs/day`}
                />
              </div>

              <div>
                <label className="ai-field-label">Daily Generation Time</label>
                <Input
                  type="time"
                  value={generationTime}
                  onChange={(e) => setGenerationTime(e.target.value)}
                />
              </div>

              <div>
                <label className="ai-field-label">Safety Generation Cap</label>
                <Input
                  type="number"
                  min="5"
                  max="100"
                  value={maxGenerationQty}
                  onChange={(e) => setMaxGenerationQty(Number(e.target.value) || 50)}
                />
              </div>
            </div>
          </div>

          {/* Card 2: AI Engine & Publishing Rule (2 Side-by-Side Cards) */}
          <div className="ai-cards-grid">
            {/* AI Model Picker */}
            <div className="glass-card ai-sub-card">
              <div className="ai-sub-card-header">
                <Cpu size={16} className="text-[var(--red)]" />
                <h4 className="ai-sub-card-title">
                  Primary AI Model
                </h4>
              </div>
              <CustomSelect
                value={selectedModel}
                onChange={(val) => setSelectedModel(val)}
                options={supportedModelsList.map((m) => ({
                  value: m.value,
                  label: m.label,
                }))}
              />
            </div>

            {/* Production Publishing Switch with Design System Checkbox */}
            <div className="glass-card ai-sub-card">
              <div className="ai-publish-toggle-row">
                <div className="df-g8 al-c">
                  <ShieldCheck size={16} className={autoPublish ? "text-[var(--green)]" : "text-[var(--muted)]"} />
                  <h4 className="ai-sub-card-title">
                    Auto-Publish to Production
                  </h4>
                </div>
                <input
                  type="checkbox"
                  className="custom-checkbox green"
                  checked={autoPublish}
                  onChange={(e) => setAutoPublish(e.target.checked)}
                />
              </div>

              <p className="ai-publish-status-text">
                {autoPublish ? (
                  <span className="ai-publish-status-active">
                    ✓ Generates articles, sources photos, and publishes directly to production.
                  </span>
                ) : (
                  <span>
                    Saved as &quot;Draft&quot; in Sanity CMS for manual review before going live.
                  </span>
                )}
              </p>
              <div className="ai-publish-safeguard-hint">
                Strict 15-point quality checks ensure articles scoring &lt;80 are never published.
              </div>
            </div>
          </div>

          {/* Card 3: Minimal Projection Summary & Optional Calendar Breakdown */}
          <div className="glass-card ai-settings-card-compact">
            <div className="ai-projections-summary-header">
              <div>
                <h4 className="ai-sub-card-title">
                  Cadence Output Projections
                </h4>
                <p className="ai-section-desc">
                  Calculated dynamically across the next 30 calendar days
                </p>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCalendarBreakdown((prev) => !prev)}
                className="text-[#a78bfa] text-xs"
              >
                <span>{showCalendarBreakdown ? "Hide Calendar Breakdown" : "View 30-Day Breakdown"}</span>
                {showCalendarBreakdown ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </Button>
            </div>

            {/* Compact 4-Stat Strip */}
            <div className="ai-projections-strip">
              <div className="ai-projection-card">
                <div className="ai-projection-metric-label">Active Days</div>
                <div className="ai-projection-metric-val text-[var(--green)]">
                  {dynamicPreview?.activeDaysCount || 0} / 30
                </div>
              </div>

              <div className="ai-projection-card">
                <div className="ai-projection-metric-label">7-Day Output</div>
                <div className="ai-projection-metric-val text-[var(--gold)]">
                  {dynamicPreview?.expectedWeeklyTotal || 0} blogs
                </div>
              </div>

              <div className="ai-projection-card">
                <div className="ai-projection-metric-label">30-Day Forecast</div>
                <div className="ai-projection-metric-val text-white">
                  {dynamicPreview?.expectedMonthlyTotal || 0} blogs
                </div>
              </div>

              <div className="ai-projection-card">
                <div className="ai-projection-metric-label">Estimated Tokens</div>
                <div className="ai-projection-metric-val text-[#a78bfa]">
                  ~{((dynamicPreview?.estimatedTotalTokens || 0) / 1000).toFixed(0)}k
                </div>
              </div>
            </div>

            {/* Collapsible 30-Day Tile View */}
            {showCalendarBreakdown && (
              <div className="ai-calendar-breakdown-wrap">
                <div className="ai-calendar-grid">
                  {dynamicPreview?.days.map((day) => (
                    <div
                      key={day.date}
                      className={`calendar-day-tile ${day.isActive ? "active" : ""}`}
                    >
                      <span className="calendar-day-name">{day.dayOfWeek.slice(0, 3)}</span>
                      <span className="calendar-day-date">{day.date.split("-").slice(1).join("/")}</span>
                      {day.isActive ? (
                        <span className="calendar-day-badge">+{day.quantity}</span>
                      ) : (
                        <span className="calendar-day-skip">Skip</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── TAB 2: BRAND VOICE & PROMPTS ─── */}
      {activeTab === "prompts" && (
        <div className="ai-view-container">
          <div className="glass-card ai-settings-card-compact">
            {/* Category Switcher Row */}
            <div className="ai-prompt-studio-header">
              <div>
                <div className="ai-prompt-cat-label">
                  Prompt Template Category
                </div>
                <div className="mt-6">
                  <CustomSelect
                    value={selectedPromptId}
                    onChange={(val) => handleSelectPrompt(val)}
                    options={prompts.map((p) => ({
                      value: p.id,
                      label: `${p.name} (v${p.current_version_number || 1})`,
                    }))}
                  />
                </div>
              </div>

              {/* Desktop view (> 900px): All 3 buttons shown */}
              <div className="ai-prompt-actions-desktop df-g8 al-c">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowVersions((prev) => !prev)}
                >
                  <History size={14} />
                  <span>Version History ({promptVersions.length})</span>
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleRestoreDefaultPrompt}
                >
                  <RotateCcw size={14} />
                  <span>Restore Factory Default</span>
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSavePrompt}
                  disabled={savingPrompt}
                >
                  <CheckCircle2 size={14} />
                  <span>{savingPrompt ? "Saving..." : "Save Prompt"}</span>
                </Button>
              </div>

              {/* Compact / Overflow view (<= 900px): Save Prompt + Secondary Three-Dot Menu */}
              <div className="ai-prompt-actions-compact df-g8 al-c">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSavePrompt}
                  disabled={savingPrompt}
                >
                  <CheckCircle2 size={14} />
                  <span>{savingPrompt ? "Saving..." : "Save"}</span>
                </Button>

                <DropdownMenu
                  items={[
                    {
                      label: `Version History (${promptVersions.length})`,
                      icon: <History size={14} />,
                      onSelect: () => setShowVersions((prev) => !prev),
                    },
                    {
                      label: "Restore Factory Default",
                      icon: <RotateCcw size={14} />,
                      onSelect: handleRestoreDefaultPrompt,
                    },
                  ]}
                  align="end"
                  trigger={
                    <Button
                      variant="secondary"
                      size="icon"
                      pill
                      className="btn-secondary header-more-btn-sm"
                      title="More prompt actions"
                      aria-label="More prompt actions"
                    >
                      <IconDotsHorizontal size={16} />
                    </Button>
                  }
                />
              </div>
            </div>

            {/* Prompt Description */}
            {currentPromptObj?.description && (
              <div className="ai-prompt-desc-banner">
                {currentPromptObj.description}
              </div>
            )}

            {/* Version History Drawer/Section */}
            {showVersions && promptVersions.length > 0 && (
              <div className="ai-versions-panel">
                <div className="ai-versions-title">
                  Version History & Instant Rollback
                </div>
                <div className="ai-versions-list">
                  {promptVersions.map((v) => (
                    <div key={v.id} className="ai-version-item">
                      <div className="df-g8 al-c">
                        <span className="font-bold text-[var(--gold)]">v{v.version_number}</span>
                        <span className="text-white">{v.change_summary || "Updated"}</span>
                        <span className="text-[var(--muted)] text-[11px]">
                          • {new Date(v.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRollbackPrompt(v.version_number)}
                        className="h-6 text-xs"
                      >
                        <RotateCcw size={12} />
                        <span>Rollback</span>
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Prompt Textareas Stack */}
            <div className="ai-prompt-textareas-stack">
              <div>
                <div className="ai-prompt-field-header">
                  <label className="ai-field-label m-0">
                    System Directive & Tone of Voice
                  </label>
                  <span className="text-xs text-[var(--muted)]">
                    {editingSysPrompt.length} characters
                  </span>
                </div>
                <textarea
                  rows={5}
                  value={editingSysPrompt}
                  onChange={(e) => setEditingSysPrompt(e.target.value)}
                  className="ai-prompt-textarea-field"
                />
              </div>

              <div>
                <div className="ai-prompt-field-header">
                  <label className="ai-field-label m-0">
                    User Prompt Template
                  </label>
                  <div className="df-g6 al-c">
                    <span className="text-xs text-[var(--muted)] mr-4">Click to insert:</span>
                    {["{{title}}", "{{category}}", "{{keywords}}"].map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => insertVariable(tag)}
                        className="ai-variable-chip"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
                <textarea
                  rows={4}
                  value={editingUsrTemplate}
                  onChange={(e) => setEditingUsrTemplate(e.target.value)}
                  className="ai-prompt-textarea-field"
                />
              </div>

              <div>
                <label className="ai-field-label">Audit Log Change Summary</label>
                <Input
                  placeholder="e.g. Reinforced Hyderabad commercial intent & added Jubilee Hills restaurant context"
                  value={changeSummary}
                  onChange={(e) => setChangeSummary(e.target.value)}
                />
              </div>
            </div>

            {/* Test Prompt Live Section */}
            <div className="ai-test-panel-wrap">
              <div className="ai-test-panel-header">
                <div>
                  <div className="ai-interval-title">Live AI Evaluation</div>
                  <div className="ai-section-desc">
                    Executes this prompt against Google Gemini with sample test variables
                  </div>
                </div>

                <HoverBorderGradient
                  size="sm"
                  onClick={handleTestPrompt}
                  disabled={testingPrompt}
                  loading={testingPrompt}
                  title="Run sample test prompt"
                >
                  <Send size={13} />
                  <span>{testingPrompt ? "Evaluating with AI..." : "Test Prompt Live"}</span>
                </HoverBorderGradient>
              </div>

              {testOutput && (
                <div className="ai-test-output-card">
                  <div className="ai-test-output-meta">
                    <span className="text-white font-semibold">Sample Generation Output</span>
                    <span>
                      Latency: <strong className="text-white">{testOutput.latency}ms</strong> • Tokens:{" "}
                      <strong className="text-white">{testOutput.tokens}</strong>
                    </span>
                  </div>
                  <pre className="ai-test-output-pre">
                    {testOutput.output}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── 3. Floating Unsaved Changes Alert Bar ─── */}
      {isDirty && (
        <div className="ai-dirty-banner">
          <div className="df-g8 al-c">
            <span className="ai-dirty-dot" />
            <span className="ai-dirty-text">
              You have unsaved schedule changes
            </span>
          </div>
          <div className="df-g8 al-c">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => fetchScheduleConfig()}
            >
              Discard
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveScheduleConfig}
              disabled={savingSchedule}
            >
              <CheckCircle2 size={14} />
              <span>{savingSchedule ? "Saving..." : "Save Changes"}</span>
            </Button>
          </div>
        </div>
      )}

      {/* ─── 4. Minimal On-Demand Batch Trigger Modal ─── */}
      {showTriggerModal && (
        <div className="modal-overlay active z-modal" onClick={() => setShowTriggerModal(false)}>
          <div
            className="modal ai-batch-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header mb-12">
              <div className="modal-title df-g8 al-c">
                <Zap size={18} className="text-[var(--red)]" />
                <span>Trigger On-Demand Batch</span>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={() => setShowTriggerModal(false)}
              >
                ✕
              </button>
            </div>

            <p className="ai-section-desc mb-16">
              Instantly schedules high-ROI article generations using your active brand guidelines.
            </p>

            <div className="mb-16">
              <label className="form-label mb-8">
                Number of Articles to Generate
              </label>
              <div className="df-g8 mb-10">
                {[5, 10, 15, 25].map((qty) => (
                  <button
                    key={qty}
                    type="button"
                    onClick={() => setManualBatchQty(qty)}
                    className={`ai-batch-preset-btn ${manualBatchQty === qty ? "active" : ""}`}
                  >
                    {qty}
                  </button>
                ))}
              </div>
              <Input
                type="number"
                min="1"
                max={maxGenerationQty}
                value={manualBatchQty}
                onChange={(e) => setManualBatchQty(Number(e.target.value) || 1)}
              />
              <span className="ai-field-hint mt-4 block">
                Safety generation limit: {maxGenerationQty} articles
              </span>
            </div>

            <div className="modal-actions mt-16">
              <Button
                variant="secondary"
                onClick={() => setShowTriggerModal(false)}
              >
                Cancel
              </Button>
              <HoverBorderGradient
                onClick={handleTriggerManualBatch}
                disabled={triggeringBatch}
                loading={triggeringBatch}
                title={`Queue ${manualBatchQty} AI Blogs`}
              >
                <Zap size={15} />
                <span>{triggeringBatch ? "Queuing..." : `Queue ${manualBatchQty} Blogs`}</span>
              </HoverBorderGradient>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AiBlogSettings;
