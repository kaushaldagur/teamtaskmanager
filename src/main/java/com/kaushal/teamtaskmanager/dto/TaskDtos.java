package com.kaushal.teamtaskmanager.dto;

import com.kaushal.teamtaskmanager.entity.Task;
import com.kaushal.teamtaskmanager.entity.TaskPriority;
import com.kaushal.teamtaskmanager.entity.TaskStatus;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.util.LinkedHashSet;
import java.util.Set;

public final class TaskDtos {
	private TaskDtos() {
	}

	public record TaskRequest(
			@NotBlank @Size(max = 140) String title,
			@NotBlank @Size(max = 1600) String description,
			@NotNull TaskPriority priority,
			@NotNull TaskStatus status,
			@NotNull @FutureOrPresent LocalDate dueDate,
			@NotNull Long assignedUserId,
			@NotNull Long projectId,
			Set<String> tags) {
	}

	public record TaskStatusRequest(@NotNull TaskStatus status) {
	}

	public record TaskResponse(
			Long id,
			String title,
			String description,
			TaskPriority priority,
			TaskStatus status,
			LocalDate dueDate,
			UserResponse assignedTo,
			Long projectId,
			String projectName,
			Set<String> tags) {
		public static TaskResponse from(Task task) {
			return new TaskResponse(
					task.getId(),
					task.getTitle(),
					task.getDescription(),
					task.getPriority(),
					task.getStatus(),
					task.getDueDate(),
					UserResponse.from(task.getAssignedTo()),
					task.getProject().getId(),
					task.getProject().getName(),
					new LinkedHashSet<>(task.getTags()));
		}
	}
}
