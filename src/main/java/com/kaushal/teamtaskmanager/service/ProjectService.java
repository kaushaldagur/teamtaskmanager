package com.kaushal.teamtaskmanager.service;

import com.kaushal.teamtaskmanager.dto.ProjectDtos.ProjectMemberRequest;
import com.kaushal.teamtaskmanager.dto.ProjectDtos.ProjectRequest;
import com.kaushal.teamtaskmanager.dto.ProjectDtos.ProjectResponse;
import com.kaushal.teamtaskmanager.entity.Project;
import com.kaushal.teamtaskmanager.entity.Role;
import com.kaushal.teamtaskmanager.entity.TaskStatus;
import com.kaushal.teamtaskmanager.entity.User;
import com.kaushal.teamtaskmanager.exception.ApiException;
import com.kaushal.teamtaskmanager.repository.ProjectRepository;
import com.kaushal.teamtaskmanager.repository.TaskRepository;
import com.kaushal.teamtaskmanager.repository.UserRepository;
import java.util.LinkedHashSet;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ProjectService {
	private final ProjectRepository projectRepository;
	private final UserRepository userRepository;
	private final TaskRepository taskRepository;
	private final CurrentUserService currentUserService;

	@Transactional
	@PreAuthorize("hasRole('ADMIN')")
	public ProjectResponse create(ProjectRequest request) {
		User creator = currentUserService.user();
		var members = new LinkedHashSet<>(userRepository.findAllById(request.memberIds()));
		if (members.size() != request.memberIds().size()) {
			throw new ApiException(HttpStatus.BAD_REQUEST, "One or more team members do not exist");
		}
		members.add(creator);
		Project project = Project.builder()
				.name(request.name())
				.description(request.description())
				.deadline(request.deadline())
				.createdBy(creator)
				.members(members)
				.build();
		return toResponse(projectRepository.save(project));
	}

	@Transactional(readOnly = true)
	public List<ProjectResponse> visibleProjects() {
		User user = currentUserService.user();
		List<Project> projects = user.getRole() == Role.ADMIN
				? projectRepository.findAll()
				: projectRepository.findVisibleToUser(user.getId());
		return projects.stream().map(this::toResponse).toList();
	}

	@Transactional(readOnly = true)
	public ProjectResponse details(Long id) {
		Project project = findProject(id);
		ensureVisible(project);
		return toResponse(project);
	}

	@Transactional
	@PreAuthorize("hasRole('ADMIN')")
	public ProjectResponse addMember(Long id, ProjectMemberRequest request) {
		Project project = findProject(id);
		User member = userRepository.findById(request.userId())
				.orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));
		project.getMembers().add(member);
		return toResponse(project);
	}

	@Transactional
	@PreAuthorize("hasRole('ADMIN')")
	public void removeMember(Long id, Long userId) {
		Project project = findProject(id);
		project.getMembers().removeIf(member -> member.getId().equals(userId));
	}

	@Transactional
	@PreAuthorize("hasRole('ADMIN')")
	public void delete(Long id) {
		Project project = findProject(id);
		taskRepository.deleteByProjectId(project.getId());
		projectRepository.delete(project);
	}

	Project findProject(Long id) {
		return projectRepository.findById(id)
				.orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Project not found"));
	}

	void ensureVisible(Project project) {
		User user = currentUserService.user();
		if (user.getRole() == Role.ADMIN || project.getMembers().stream().anyMatch(member -> member.getId().equals(user.getId()))) {
			return;
		}
		throw new ApiException(HttpStatus.FORBIDDEN, "You are not part of this project");
	}

	private ProjectResponse toResponse(Project project) {
		var tasks = taskRepository.findByProjectIdOrderByDueDateAsc(project.getId());
		long completed = tasks.stream().filter(task -> task.getStatus() == TaskStatus.DONE).count();
		return ProjectResponse.from(project, tasks.size(), completed);
	}
}
