"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Blog } from "../types";
import { Button, Input, Tabs, TabsList, TabsTrigger } from "@/components/ui";
import { CustomSelect } from "../components/CustomSelect";
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
} from "lucide-react";

interface AiBlogSettingsProps {
  blogs?: Blog[];
  onNavigateTab?: (page: string) => void;
  showToast?: (msg: string, type?: "success" | "error") => void;
  onHeaderChange?: (left: React.ReactNode, right: React.ReactNode) => void;
}

export function AiBlogSettings({
  blogs = [],
  onNavigateTab,
  showToast,
  onHeaderChange,
}: AiBlogSettingsProps) {
  // Main Tab State
  const [activeTab, setActiveTab] = useState<"controls" | "prompts">("controls");

  // Scheduling State
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
  const [selectedModel, setSelectedModel] = useState<string>("llama-3.3-70b-versatile");
  const [savingSchedule, setSavingSchedule] = useState(false);

  // Dynamic 30-day Preview
  const [dynamicPreview, setDynamicPreview] = useState<{
    days: { date: string; dayOfWeek: string; isActive: boolean; quantity: number }[];
    activeDaysCount: number;
    expectedWeeklyTotal: number;
    expectedMonthlyTotal: number;
    estimatedTotalTokens: number;
  } | null>(null);

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
  const [savingPrompt, setSavingPrompt] = useState(false);
  const [testingPrompt, setTestingPrompt] = useState(false);
  const [testOutput, setTestOutput] = useState<{ output: string; latency: number; tokens: number } | null>(null);

  // Manual Trigger Modal
  const [showTriggerModal, setShowTriggerModal] = useState(false);
  const [manualBatchQty, setManualBatchQty] = useState(10);
  const [triggeringBatch, setTriggeringBatch] = useState(false);

  const supportedModelsList = [
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant",
    "mixtral-8x7b-32768",
    "gemma2-9b-it",
    "gemini-2.5-flash",
    "meta-llama/llama-3.3-70b-instruct",
  ];

  // Fetch Schedule Configuration
  const fetchScheduleConfig = useCallback(async () => {
    try {
      const res = await customFetch("/api/ai/schedule");
      const json = await res.json();
      const s = json.schedule || json.activeSchedule;
      if (json.success && s) {
        setScheduleType(s.schedule_type || "daily");
        if (s.blogs_per_active_day !== undefined && s.blogs_per_active_day !== null) {
          setBlogsPerActiveDay(Number(s.blogs_per_active_day));
        }
        if (s.max_daily_generation_limit || s.max_generation_quantity) {
          setMaxGenerationQty(Number(s.max_daily_generation_limit || s.max_generation_quantity));
        }
        if (Array.isArray(s.active_weekdays)) setActiveWeekdays(s.active_weekdays);
        if (s.interval_days) setIntervalDays(Number(s.interval_days));
        if (s.weekday_quantities) setWeekdayQuantities(s.weekday_quantities);
        if (s.generation_time) setGenerationTime(s.generation_time);
        setAutoPublish(s.auto_publish_to_sanity ?? s.auto_publish ?? true);
        if (s.groq_model || s.model) setSelectedModel(s.groq_model || s.model);
        if (s.is_active !== undefined) setAutomationActive(Boolean(s.is_active));
      }
    } catch {
      // ignore
    }
  }, []);

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
    fetchScheduleConfig();
    fetchPrompts();
  }, [fetchScheduleConfig, fetchPrompts]);

  useEffect(() => {
    fetchPreview();
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

  // Switch Selected Prompt in Editor
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

  // Save Prompt Changes
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
          change_summary: changeSummary || "Updated via Prompt Management Studio",
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

  // Rollback Prompt to Version
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

  // Trigger Manual Batch Run
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
        showToast?.(`Queued batch of ${manualBatchQty} blog articles for creation!`, "success");
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

  const onHeaderChangeRef = useRef(onHeaderChange);
  useEffect(() => {
    onHeaderChangeRef.current = onHeaderChange;
  });

  useEffect(() => {
    onHeaderChangeRef.current?.(
      null,
      <div className="df-g8 al-c">
        <Button
          variant="gold"
          onClick={() => setShowTriggerModal(true)}
          title="Trigger Batch Generation"
        >
          <Zap size={16} />
          <span>Trigger Batch</span>
        </Button>
      </div>
    );
  }, []);

  useEffect(() => {
    return () => {
      onHeaderChangeRef.current?.(null, null);
    };
  }, []);

  return (
    <div className="ai-view-container">
      {/* ─── Unified Metrics Row (ReelScale Standard .stat-grid) ─── */}
      <div className="stat-grid">
        <div className="stat-card white">
          <div className="stat-label">Daily Target Quota</div>
          <div className="stat-value">
            <span>{blogsPerActiveDay}</span>
            <span className="stat-unit">Blogs/Day</span>
          </div>
          <div className="stat-icon">
            <Clock size={20} className="text-zinc-300" />
          </div>
        </div>

        <div className="stat-card gold">
          <div className="stat-label">Active Strategy</div>
          <div className="stat-value gold text-lg capitalize">
            <span>{scheduleType.replace("_", " ")}</span>
          </div>
          <div className="stat-icon">
            <Calendar size={20} className="text-[var(--gold)]" />
          </div>
        </div>

        <div className="stat-card green">
          <div className="stat-label">Automation Status</div>
          <div className="stat-value green text-lg">
            <span>{automationActive ? "Operational" : "Paused"}</span>
          </div>
          <div className="stat-icon">
            <CheckCircle2 size={20} className="text-[var(--green)]" />
          </div>
        </div>

        <div className="stat-card red">
          <div className="stat-label">AI Inference Engine</div>
          <div className="stat-value text-lg">
            <span>Groq LPU</span>
          </div>
          <div className="stat-icon">
            <Cpu size={20} className="text-[var(--red)]" />
          </div>
        </div>
      </div>

      {/* ─── Master Automation Header Panel with Integrated Section Switcher ─── */}
      <div className="glass-card ai-header-card">
        <div className="ai-header-content">
          <div className="ai-title-group">
            <span
              className={`ai-status-indicator ${automationActive ? "active" : "paused"}`}
            />
            <h2 className="page-section-title">
              AI Blog Automation Engine
            </h2>
            <span className={`badge ${automationActive ? "badge-green" : "badge-red"}`}>
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

          <div className="df-g8 al-c">
            <Tabs
              value={activeTab}
              onValueChange={(val) => setActiveTab(val as "controls" | "prompts")}
            >
              <TabsList>
                <TabsTrigger value="controls">Scheduling & Controls</TabsTrigger>
                <TabsTrigger value="prompts">Prompt Management Studio</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </div>

      {/* ─── TAB 1: SCHEDULING CONTROLS & 30-DAY PREVIEW ─── */}
      {activeTab === "controls" && (
        <div className="ai-view-container">
          <div className="ai-settings-layout">
            {/* Left Col: Schedule Strategy & Parameters */}
            <div className="glass-card ai-settings-card">
              <div className="ai-card-header">
                <div className="ai-card-header-text">
                  <div className="glass-card-label">Generation Strategy & Frequency</div>
                  <p className="ai-section-desc">Configure automation cadence, daily quotas, and scheduled execution times.</p>
                </div>
                <Button
                  variant="primary"
                  onClick={handleSaveScheduleConfig}
                  disabled={savingSchedule}
                >
                  <CheckCircle2 size={16} />
                  <span>{savingSchedule ? "Saving..." : "Save Configuration"}</span>
                </Button>
              </div>

              {/* Mode Selection */}
              <div className="ai-settings-section">
                <label className="ai-field-label">
                  Select Scheduling Mode
                </label>
                <div className="schedule-mode-grid">
                  {[
                    { id: "daily", label: "Every Day", desc: "Uniform daily batches" },
                    { id: "selected_weekdays", label: "Selected Weekdays", desc: "Mon, Wed, Fri etc." },
                    { id: "alternate_days", label: "Alternate Days", desc: "Day on, day off" },
                    { id: "every_n_days", label: "Every N Days", desc: "Every 2, 3, 5, 7 days" },
                    { id: "weekly_custom", label: "Weekly Schedule", desc: "Custom qty per weekday" },
                    { id: "custom_dates", label: "Custom Dates", desc: "Exact calendar dates" },
                    { id: "one_time", label: "One-Time Batch", desc: "Single execution" },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setScheduleType(m.id)}
                      className={`schedule-mode-card ${scheduleType === m.id ? "active" : ""}`}
                    >
                      <div className="schedule-mode-title">{m.label}</div>
                      <div className="schedule-mode-desc">{m.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Mode-Specific Controls */}
              {scheduleType === "selected_weekdays" && (
                <div className="ai-subpanel-box">
                  <label className="ai-field-label">
                    Active Weekdays
                  </label>
                  <div className="ai-chips-wrap">
                    {["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].map((day) => {
                      const isSel = activeWeekdays.includes(day);
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => {
                            setActiveWeekdays((prev) =>
                              isSel ? prev.filter((d) => d !== day) : [...prev, day]
                            );
                          }}
                          className={`option-chip-btn ${isSel ? "active" : ""}`}
                        >
                          {day.charAt(0).toUpperCase() + day.slice(1)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {scheduleType === "every_n_days" && (
                <div className="ai-subpanel-box">
                  <label className="ai-field-label">
                    Interval Frequency
                  </label>
                  <div className="ai-chips-wrap">
                    {[2, 3, 4, 5, 7].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setIntervalDays(num)}
                        className={`option-chip-btn ${intervalDays === num ? "active" : ""}`}
                      >
                        Every {num} Days
                      </button>
                    ))}
                    <div className="ai-custom-input-wrap">
                      <span className="text-xs text-[var(--muted)]">Custom:</span>
                      <Input
                        type="number"
                        min="1"
                        max="30"
                        value={intervalDays}
                        onChange={(e) => setIntervalDays(Number(e.target.value) || 1)}
                        className="w-20"
                      />
                    </div>
                  </div>
                </div>
              )}

              {scheduleType === "weekly_custom" && (
                <div className="ai-subpanel-box">
                  <label className="ai-field-label">
                    Custom Blogs Per Weekday
                  </label>
                  <div className="ai-weekday-grid">
                    {["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].map((day) => (
                      <div key={day} className="ai-weekday-cell">
                        <span className="ai-weekday-cell-label">
                          {day.slice(0, 3)}
                        </span>
                        <Input
                          type="number"
                          min="0"
                          max={maxGenerationQty}
                          value={weekdayQuantities[day] ?? 0}
                          onChange={(e) => {
                            const val = Number(e.target.value) || 0;
                            setWeekdayQuantities((prev) => ({ ...prev, [day]: val }));
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Core Quantity & Timing Controls */}
              <div className="ai-controls-grid">
                <div className="ai-control-field">
                  <div className="ai-field-header">
                    <label>Blogs Per Active Day</label>
                    <span className="ai-field-value-pill">{blogsPerActiveDay} blogs</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max={maxGenerationQty}
                    value={blogsPerActiveDay}
                    onChange={(e) => setBlogsPerActiveDay(Number(e.target.value))}
                    className="ai-field-slider"
                  />
                  <p className="ai-field-hint">Configurable daily target quota</p>
                </div>

                <div className="ai-control-field">
                  <div className="ai-field-header">
                    <label>Daily Generation Time</label>
                  </div>
                  <Input
                    type="time"
                    value={generationTime}
                    onChange={(e) => setGenerationTime(e.target.value)}
                  />
                  <p className="ai-field-hint">Runs in timezone: {timezone}</p>
                </div>

                <div className="ai-control-field">
                  <div className="ai-field-header">
                    <label>Maximum Daily Limit</label>
                  </div>
                  <Input
                    type="number"
                    min="5"
                    max="100"
                    value={maxGenerationQty}
                    onChange={(e) => setMaxGenerationQty(Number(e.target.value) || 50)}
                  />
                  <p className="ai-field-hint">Hard daily safety threshold</p>
                </div>
              </div>

              {/* Publishing & Provider Config */}
              <div className="ai-provider-grid">
                <div className="ai-control-field">
                  <label className="ai-field-label">Active Groq AI Model</label>
                  <CustomSelect
                    value={selectedModel}
                    onChange={(val) => setSelectedModel(val)}
                    options={supportedModelsList.map((m) => ({
                      value: m,
                      label: m,
                    }))}
                  />
                  <p className="ai-field-hint">Connected to Groq LPU inference</p>
                </div>

                <div className="ai-checkbox-card">
                  <div className="ai-checkbox-info">
                    <span className="ai-checkbox-title">Auto-Publish to Sanity</span>
                    <span className="ai-checkbox-desc">
                      {autoPublish
                        ? "Publishes to Sanity Studio when validation score >= 80"
                        : "Saves as Draft in Sanity for editorial review"}
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoPublish}
                    onChange={(e) => setAutoPublish(e.target.checked)}
                    className="ai-checkbox-input"
                  />
                </div>
              </div>
            </div>

            {/* Right Column: Projections & Safeguards */}
            <div className="glass-card ai-projections-card">
              <div className="ai-projections-header">
                <div className="glass-card-label">Execution Projections</div>
                <p className="ai-section-desc">Estimated over the next 30 calendar days</p>
              </div>

              <div className="ai-projection-list">
                <div className="ai-projection-box">
                  <span className="ai-projection-label">Active Generation Days</span>
                  <span className="ai-projection-val text-[var(--green)]">
                    {dynamicPreview?.activeDaysCount || 0} / 30 days
                  </span>
                </div>

                <div className="ai-projection-box">
                  <span className="ai-projection-label">Expected 7-Day Total</span>
                  <span className="ai-projection-val text-[var(--gold)]">
                    {dynamicPreview?.expectedWeeklyTotal || 0} blogs
                  </span>
                </div>

                <div className="ai-projection-box">
                  <span className="ai-projection-label">Expected 30-Day Total</span>
                  <span className="ai-projection-val">
                    {dynamicPreview?.expectedMonthlyTotal || 0} blogs
                  </span>
                </div>

                <div className="ai-projection-box">
                  <span className="ai-projection-label">Estimated AI Token Usage</span>
                  <span className="ai-projection-val text-[var(--gold)]">
                    ~{((dynamicPreview?.estimatedTotalTokens || 0) / 1000).toFixed(0)}k tokens
                  </span>
                </div>
              </div>

              <div className="ai-safeguard-box">
                <div className="ai-safeguard-header">
                  <ShieldCheck size={16} />
                  <span>Production Safeguards Active</span>
                </div>
                <p className="ai-safeguard-desc">
                  Persistent queue architecture guarantees zero lost jobs. Generated articles sync directly to Sanity Studio Content Lake.
                </p>
              </div>
            </div>
          </div>

          {/* ─── 30-Day Interactive Calendar Preview ─── */}
          <div className="glass-card ai-calendar-card">
            <div className="ai-calendar-header">
              <div className="df-g8 al-c">
                <Calendar size={18} className="text-[var(--red)]" />
                <div className="glass-card-label mb-0 text-white">30-Day Dynamic Schedule Forecast</div>
              </div>
              <div className="ai-calendar-legend">
                <div className="ai-legend-item">
                  <span className="calendar-legend-dot active" />
                  <span>Active Day</span>
                </div>
                <div className="ai-legend-item">
                  <span className="calendar-legend-dot skip" />
                  <span>Skipped Day</span>
                </div>
              </div>
            </div>

            <div className="ai-calendar-grid">
              {dynamicPreview?.days.map((day) => (
                <div
                  key={day.date}
                  className={`calendar-day-tile ${day.isActive ? "active" : ""}`}
                >
                  <span className="calendar-day-name">
                    {day.dayOfWeek.slice(0, 3)}
                  </span>
                  <span className="calendar-day-date">
                    {day.date.split("-").slice(1).join("/")}
                  </span>
                  {day.isActive ? (
                    <span className="calendar-day-badge">
                      +{day.quantity}
                    </span>
                  ) : (
                    <span className="calendar-day-skip">Skip</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 2: PROMPT MANAGEMENT STUDIO ─── */}
      {activeTab === "prompts" && (
        <div className="ai-prompt-studio-grid">
          {/* Left Column: 12 Prompt Categories */}
          <div className="glass-card ai-prompt-list-card">
            <div className="ai-prompt-list-header">
              <div className="glass-card-label">
                Configurable Prompts
              </div>
              <p className="ai-section-desc">
                12 Database Categories • Zero Hardcoding
              </p>
            </div>
            <div className="ai-prompt-list">
              {prompts.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelectPrompt(p.id)}
                  className={`prompt-card-btn ${selectedPromptId === p.id ? "active" : ""}`}
                >
                  <div className="ai-prompt-item-header">
                    <span className="ai-prompt-item-title">{p.name}</span>
                    <span className="ai-prompt-item-version">
                      v{p.current_version_number}
                    </span>
                  </div>
                  <span className="ai-prompt-item-cat">{p.category}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Right Column: Prompt Editor & Test Studio */}
          <div className="glass-card ai-prompt-editor-card">
            <div className="ai-prompt-editor-header">
              <div className="ai-prompt-editor-title-group">
                <h3 className="card-section-title">
                  {prompts.find((p) => p.id === selectedPromptId)?.name || selectedPromptId}
                </h3>
                <p className="ai-section-desc">
                  {prompts.find((p) => p.id === selectedPromptId)?.description}
                </p>
              </div>
              <div className="df-g8 al-c">
                <Button
                  variant="secondary"
                  onClick={handleRestoreDefaultPrompt}
                >
                  <RotateCcw size={16} />
                  <span>Restore Default</span>
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSavePrompt}
                  disabled={savingPrompt}
                >
                  <CheckCircle2 size={16} />
                  <span>{savingPrompt ? "Saving..." : "Save Prompt"}</span>
                </Button>
              </div>
            </div>

            {/* Editor Textareas */}
            <div className="ai-prompt-fields-stack">
              <div>
                <label className="ai-field-label">
                  System Directive Prompt
                </label>
                <textarea
                  rows={6}
                  value={editingSysPrompt}
                  onChange={(e) => setEditingSysPrompt(e.target.value)}
                  className="ai-prompt-textarea"
                />
              </div>

              <div>
                <label className="ai-field-label">
                  User Prompt Template (Supports variables like &#123;&#123;title&#125;&#125;, &#123;&#123;category&#125;&#125;)
                </label>
                <textarea
                  rows={5}
                  value={editingUsrTemplate}
                  onChange={(e) => setEditingUsrTemplate(e.target.value)}
                  className="ai-prompt-textarea"
                />
              </div>

              <div>
                <label className="ai-field-label">Change Summary (for version audit trail)</label>
                <Input
                  placeholder="e.g. Added Hyderabad Jubilee Hills context and strict word count constraint"
                  value={changeSummary}
                  onChange={(e) => setChangeSummary(e.target.value)}
                />
              </div>
            </div>

            {/* Testing & Output Area */}
            <div className="ai-prompt-test-panel">
              <div className="ai-prompt-test-header">
                <span className="ai-field-label">
                  Test Prompt Live with AI Model
                </span>
                <Button
                  variant="gold"
                  onClick={handleTestPrompt}
                  disabled={testingPrompt}
                >
                  <Send size={16} className={testingPrompt ? "animate-spin" : ""} />
                  <span>{testingPrompt ? "Testing..." : "Test Prompt"}</span>
                </Button>
              </div>

              {testOutput && (
                <div className="ai-prompt-output-box">
                  <div className="ai-prompt-output-meta">
                    <span>AI Model Output Preview</span>
                    <span>
                      Latency: <strong className="text-white">{testOutput.latency}ms</strong> • Tokens:{" "}
                      <strong className="text-white">{testOutput.tokens}</strong>
                    </span>
                  </div>
                  <pre className="ai-prompt-output-code">
                    {testOutput.output}
                  </pre>
                </div>
              )}
            </div>

            {/* Version History Table */}
            {promptVersions.length > 0 && (
              <div className="ai-version-section">
                <div className="glass-card-label">
                  Version History & Rollback ({promptVersions.length} versions)
                </div>
                <div className="ai-version-list">
                  {promptVersions.map((v) => (
                    <div
                      key={v.id}
                      className="ai-version-row"
                    >
                      <div className="ai-version-meta">
                        <span className="font-bold text-[var(--gold)]">v{v.version_number}</span>
                        <span className="text-zinc-300">{v.change_summary || "Updated"}</span>
                        <span className="text-[var(--muted)] text-[11px]">
                          • {new Date(v.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRollbackPrompt(v.version_number)}
                      >
                        <RotateCcw size={13} />
                        <span>Rollback</span>
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Manual Trigger Modal ─── */}
      {showTriggerModal && (
        <div className="modal-overlay active" onClick={() => setShowTriggerModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title df-g8 al-c">
                <Zap size={18} className="text-[var(--red)]" />
                <span>Trigger On-Demand Generation</span>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={() => setShowTriggerModal(false)}
              >
                ✕
              </button>
            </div>

            <p className="ai-section-desc mb-4">
              Pulls top suggested content gaps and dispatches generation jobs to create markdown articles and sync them directly to Sanity Studio.
            </p>

            <div className="form-group">
              <label className="form-label">Number of Articles to Generate</label>
              <Input
                type="number"
                min="1"
                max={maxGenerationQty}
                value={manualBatchQty}
                onChange={(e) => setManualBatchQty(Number(e.target.value) || 1)}
              />
              <span className="ai-field-hint">Configured safety limit: {maxGenerationQty} articles</span>
            </div>

            <div className="modal-actions">
              <Button
                variant="secondary"
                onClick={() => setShowTriggerModal(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleTriggerManualBatch}
                disabled={triggeringBatch}
              >
                <Zap size={16} />
                <span>{triggeringBatch ? "Scheduling..." : `Queue ${manualBatchQty} Blogs`}</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AiBlogSettings;
