package com.kaushal.teamtaskmanager.dto;

import com.kaushal.teamtaskmanager.entity.Project;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.util.List;

public final class ProjectDtos {
	private ProjectDtos() {
	}

	public record ProjectRequest(
			@NotBlank @Size(max = 120) String name,
			@NotBlank @Size(max = 1200) String description,
			@NotNull @FutureOrPresent LocalDate deadline,
			@NotEmpty List<Long> memberIds) {
	}

	public record ProjectMemberRequest(@NotNull Long userId) {
	}

	public record ProjectResponse(
			Long id,
			String name,
			String description,
			LocalDate deadline,
			UserResponse createdBy,
			List<UserResponse> members,
			long taskCount,
			long completedTasks,
			int completionPercent) {
		public static ProjectResponse from(Project project, long taskCount, long completedTasks) {
			int completion = taskCount == 0 ? 0 : (int) Math.round((completedTasks * 100.0) / taskCount);
			return new ProjectResponse(
					project.getId(),
					project.getName(),
					project.getDescription(),
					project.getDeadline(),
					UserResponse.from(project.getCreatedBy()),
					project.getMembers().stream().map(UserResponse::from).toList(),
					taskCount,
					completedTasks,
					completion);
		}
	}
}
