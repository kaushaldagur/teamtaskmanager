package com.kaushal.teamtaskmanager.service;

import com.kaushal.teamtaskmanager.dto.TaskDtos.TaskRequest;
import com.kaushal.teamtaskmanager.dto.TaskDtos.TaskResponse;
import com.kaushal.teamtaskmanager.entity.Project;
import com.kaushal.teamtaskmanager.entity.Role;
import com.kaushal.teamtaskmanager.entity.Task;
import com.kaushal.teamtaskmanager.entity.TaskPriority;
import com.kaushal.teamtaskmanager.entity.TaskStatus;
import com.kaushal.teamtaskmanager.entity.User;
import com.kaushal.teamtaskmanager.exception.ApiException;
import com.kaushal.teamtaskmanager.repository.TaskRepository;
import com.kaushal.teamtaskmanager.repository.UserRepository;
import java.time.Instant;
import java.util.LinkedHashSet;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class TaskService {
	private final TaskRepository taskRepository;
	private final UserRepository userRepository;
	private final ProjectService projectService;
	private final CurrentUserService currentUserService;

	@Transactional
	@PreAuthorize("hasRole('ADMIN')")
	public TaskResponse create(TaskRequest request) {
		Project project = projectService.findProject(request.projectId());
		User assignee = userRepository.findById(request.assignedUserId())
				.orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Assigned user not found"));
		if (project.getMembers().stream().noneMatch(member -> member.getId().equals(assignee.getId()))) {
			throw new ApiException(HttpStatus.BAD_REQUEST, "Assigned user must be a project member");
		}
		Task task = Task.builder()
				.title(request.title())
				.description(request.description())
				.priority(request.priority())
				.status(request.status())
				.dueDate(request.dueDate())
				.assignedTo(assignee)
				.project(project)
				.tags(request.tags() == null ? new LinkedHashSet<>() : new LinkedHashSet<>(request.tags()))
				.build();
		return TaskResponse.from(taskRepository.save(task));
	}

	@Transactional(readOnly = true)
	public List<TaskResponse> search(TaskStatus status, TaskPriority priority, Long assigneeId, String search) {
		User user = currentUserService.user();
		Long scopedUserId = user.getRole() == Role.ADMIN ? null : user.getId();
		return taskRepository.search(scopedUserId, status, priority, assigneeId, blankToNull(search))
				.stream()
				.map(TaskResponse::from)
				.toList();
	}

	@Transactional(readOnly = true)
	public List<TaskResponse> projectTasks(Long projectId) {
		Project project = projectService.findProject(projectId);
		projectService.ensureVisible(project);
		return taskRepository.findByProjectIdOrderByDueDateAsc(projectId).stream().map(TaskResponse::from).toList();
	}

	@Transactional
	public TaskResponse updateStatus(Long id, TaskStatus status) {
		Task task = findTask(id);
		User user = currentUserService.user();
		if (user.getRole() != Role.ADMIN && !task.getAssignedTo().getId().equals(user.getId())) {
			throw new ApiException(HttpStatus.FORBIDDEN, "Members can only update their assigned tasks");
		}
		task.setStatus(status);
		task.setUpdatedAt(Instant.now());
		return TaskResponse.from(task);
	}

	@Transactional
	@PreAuthorize("hasRole('ADMIN')")
	public void delete(Long id) {
		taskRepository.delete(findTask(id));
	}

	private Task findTask(Long id) {
		return taskRepository.findById(id)
				.orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Task not found"));
	}

	private String blankToNull(String value) {
		return value == null || value.isBlank() ? null : value;
	}
}
