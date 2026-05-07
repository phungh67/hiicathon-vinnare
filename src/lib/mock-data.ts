// Mock pipeline output mirroring the FastAPI backend response shape
export type Profile = "healthy" | "burnout_meetings" | "burnout_isolation";

export interface PipelineResponse {
  status: string;
  pipeline_metrics: {
    l1_normalized_data: {
      meeting_burden_hrs: number;
      interruption_volume: number;
      after_hours: boolean;
      busy_work_pct: number;
      switches_per_hr: number;
      kudos: number;
      flight_risk: string;
      role: string;
    };
    l2_digital_twin_state: {
      energy_level: number;
      cognitive_load: number;
      state_summary: string;
    };
  };
  l3_application_payloads: {
    manager_approval_queue: {
      module: string;
      approval_status: string;
      action: { action_type: string; proposal_text: string; target_meeting_or_time: string };
    };
    employee_dashboard: {
      data: { current_energy_score: number; afternoon_forecast: string; suggested_task_mode: string };
    };
    active_notifications: {
      content: { nudge_title: string; nudge_message: string };
    };
    team_aggregates: {
      data: { employee_contributing: string; team_heatmap_impact: string; team_flow_status: string };
    };
  };
}

export const MOCK_RESPONSES: Record<Profile, PipelineResponse> = {
  healthy: {
    status: "success",
    pipeline_metrics: {
      l1_normalized_data: {
        meeting_burden_hrs: 2.5, interruption_volume: 4, after_hours: false,
        busy_work_pct: 20, switches_per_hr: 3, kudos: 3, flight_risk: "Low",
        role: "Senior Engineer",
      },
      l2_digital_twin_state: {
        energy_level: 82, cognitive_load: 34,
        state_summary: "Operating in flow. Strong capacity for deep work this afternoon.",
      },
    },
    l3_application_payloads: {
      manager_approval_queue: {
        module: "Auto-Rebalancing", approval_status: "no_action_needed",
        action: { action_type: "Protect Block", proposal_text: "Hold 3:00 PM as a focus block to extend the current flow state.", target_meeting_or_time: "3:00 PM" },
      },
      employee_dashboard: { data: { current_energy_score: 82, afternoon_forecast: "Stable", suggested_task_mode: "Deep Work" } },
      active_notifications: { content: { nudge_title: "Riding the wave", nudge_message: "Energy is high — consider tackling the hardest task on your list before lunch." } },
      team_aggregates: { data: { employee_contributing: "emp_001", team_heatmap_impact: "Green", team_flow_status: "Optimal" } },
    },
  },
  burnout_meetings: {
    status: "success",
    pipeline_metrics: {
      l1_normalized_data: {
        meeting_burden_hrs: 7.5, interruption_volume: 22, after_hours: true,
        busy_work_pct: 60, switches_per_hr: 15, kudos: 0, flight_risk: "High",
        role: "Product Manager",
      },
      l2_digital_twin_state: {
        energy_level: 28, cognitive_load: 87,
        state_summary: "Cognitive overload from back-to-back meetings. Burnout risk elevated.",
      },
    },
    l3_application_payloads: {
      manager_approval_queue: {
        module: "Auto-Rebalancing", approval_status: "pending_supervisor",
        action: { action_type: "Reschedule", proposal_text: "Move the 2:00 PM Sync to Thursday and protect the afternoon for recovery.", target_meeting_or_time: "2:00 PM Sync" },
      },
      employee_dashboard: { data: { current_energy_score: 28, afternoon_forecast: "Declining — pace yourself", suggested_task_mode: "Admin / Light Tasks" } },
      active_notifications: { content: { nudge_title: "Time for Fika!", nudge_message: "Step away from the screen — brew a coffee and take 15 minutes of cinnamon-bun therapy." } },
      team_aggregates: { data: { employee_contributing: "emp_042", team_heatmap_impact: "Red", team_flow_status: "Impaired by individual cognitive overload" } },
    },
  },
  burnout_isolation: {
    status: "success",
    pipeline_metrics: {
      l1_normalized_data: {
        meeting_burden_hrs: 0.5, interruption_volume: 1, after_hours: false,
        busy_work_pct: 80, switches_per_hr: 2, kudos: 0, flight_risk: "Critical",
        role: "Remote QA Tester",
      },
      l2_digital_twin_state: {
        energy_level: 35, cognitive_load: 52,
        state_summary: "Disengagement signals: low collaboration, slow output, isolation patterns.",
      },
    },
    l3_application_payloads: {
      manager_approval_queue: {
        module: "Auto-Rebalancing", approval_status: "pending_supervisor",
        action: { action_type: "Connect", proposal_text: "Schedule a 1:1 check-in within 48h to re-engage and reset goals.", target_meeting_or_time: "Tomorrow 10:00 AM" },
      },
      employee_dashboard: { data: { current_energy_score: 35, afternoon_forecast: "Flat — needs spark", suggested_task_mode: "Pair Work" } },
      active_notifications: { content: { nudge_title: "Coffee with a colleague?", nudge_message: "Try a 15-minute virtual fika with a teammate — small connection, big lift." } },
      team_aggregates: { data: { employee_contributing: "emp_117", team_heatmap_impact: "Red", team_flow_status: "At-risk: isolation pattern detected" } },
    },
  },
};

// 7-day energy trend mock per profile
export const ENERGY_TREND: Record<Profile, { day: string; energy: number; load: number }[]> = {
  healthy: [
    { day: "Mon", energy: 78, load: 40 }, { day: "Tue", energy: 80, load: 38 },
    { day: "Wed", energy: 75, load: 45 }, { day: "Thu", energy: 84, load: 32 },
    { day: "Fri", energy: 81, load: 36 }, { day: "Sat", energy: 90, load: 15 },
    { day: "Sun", energy: 82, load: 34 },
  ],
  burnout_meetings: [
    { day: "Mon", energy: 60, load: 55 }, { day: "Tue", energy: 52, load: 65 },
    { day: "Wed", energy: 45, load: 72 }, { day: "Thu", energy: 38, load: 78 },
    { day: "Fri", energy: 32, load: 84 }, { day: "Sat", energy: 35, load: 70 },
    { day: "Sun", energy: 28, load: 87 },
  ],
  burnout_isolation: [
    { day: "Mon", energy: 50, load: 50 }, { day: "Tue", energy: 48, load: 52 },
    { day: "Wed", energy: 44, load: 55 }, { day: "Thu", energy: 40, load: 53 },
    { day: "Fri", energy: 38, load: 54 }, { day: "Sat", energy: 36, load: 50 },
    { day: "Sun", energy: 35, load: 52 },
  ],
};

export const TEAM_MEMBERS = [
  { id: "emp_001", name: "Astrid Lindqvist", role: "Senior Engineer", energy: 82, load: 34, status: "Green" },
  { id: "emp_042", name: "Mikkel Sørensen", role: "Product Manager", energy: 28, load: 87, status: "Red" },
  { id: "emp_117", name: "Elin Bergström", role: "QA Tester", energy: 35, load: 52, status: "Red" },
  { id: "emp_054", name: "Johan Nilsson", role: "Designer", energy: 71, load: 42, status: "Green" },
  { id: "emp_088", name: "Saga Holm", role: "Data Scientist", energy: 58, load: 61, status: "Amber" },
  { id: "emp_023", name: "Lukas Andersen", role: "Engineer", energy: 76, load: 38, status: "Green" },
];
