package com.kaushal.teamtaskmanager.dto;

import com.kaushal.teamtaskmanager.entity.TaskPriority;
import com.kaushal.teamtaskmanager.entity.TaskStatus;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

public final class DashboardDtos {
	private DashboardDtos() {
	}

	public record DashboardResponse(
			Stats stats,
			Map<TaskStatus, Long> tasksByStatus,
			Map<TaskPriority, Long> tasksByPriority,
			List<TaskDtos.TaskResponse> tasks,
			List<ActivityItem> recentActivity,
			List<UpcomingDeadline> upcomingDeadlines,
			List<MemberPerformance> teamPerformance) {
	}

	public record Stats(long totalTasks, long completedTasks, long pendingTasks, long overdueTasks) {
	}

	public record ActivityItem(String message, String tone) {
	}

	public record UpcomingDeadline(String task, String assignee, LocalDate dueDate, TaskPriority priority) {
	}

	public record MemberPerformance(Long userId, String name, long taskCount, long completedTasks, int completionPercent) {
	}
}
