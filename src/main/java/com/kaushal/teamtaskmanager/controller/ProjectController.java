package com.kaushal.teamtaskmanager.controller;

import com.kaushal.teamtaskmanager.dto.ProjectDtos.ProjectMemberRequest;
import com.kaushal.teamtaskmanager.dto.ProjectDtos.ProjectRequest;
import com.kaushal.teamtaskmanager.dto.ProjectDtos.ProjectResponse;
import com.kaushal.teamtaskmanager.dto.TaskDtos.TaskResponse;
import com.kaushal.teamtaskmanager.service.ProjectService;
import com.kaushal.teamtaskmanager.service.TaskService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
public class ProjectController {
	private final ProjectService projectService;
	private final TaskService taskService;

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	public ProjectResponse create(@Valid @RequestBody ProjectRequest request) {
		return projectService.create(request);
	}

	@GetMapping
	public List<ProjectResponse> all() {
		return projectService.visibleProjects();
	}

	@GetMapping("/{id}")
	public ProjectResponse details(@PathVariable Long id) {
		return projectService.details(id);
	}

	@GetMapping("/{id}/tasks")
	public List<TaskResponse> tasks(@PathVariable Long id) {
		return taskService.projectTasks(id);
	}

	@PostMapping("/{id}/members")
	public ProjectResponse addMember(@PathVariable Long id, @Valid @RequestBody ProjectMemberRequest request) {
		return projectService.addMember(id, request);
	}

	@DeleteMapping("/{id}/members/{userId}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void removeMember(@PathVariable Long id, @PathVariable Long userId) {
		projectService.removeMember(id, userId);
	}
}
