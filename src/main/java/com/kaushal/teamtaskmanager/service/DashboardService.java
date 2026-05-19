package com.kaushal.teamtaskmanager.service;

import com.kaushal.teamtaskmanager.dto.DashboardDtos.ActivityItem;
import com.kaushal.teamtaskmanager.dto.DashboardDtos.DashboardResponse;
import com.kaushal.teamtaskmanager.dto.DashboardDtos.MemberPerformance;
import com.kaushal.teamtaskmanager.dto.DashboardDtos.Stats;
import com.kaushal.teamtaskmanager.dto.DashboardDtos.UpcomingDeadline;
import com.kaushal.teamtaskmanager.dto.TaskDtos.TaskResponse;
import com.kaushal.teamtaskmanager.entity.Role;
import com.kaushal.teamtaskmanager.entity.TaskPriority;
import com.kaushal.teamtaskmanager.entity.TaskStatus;
import com.kaushal.teamtaskmanager.entity.User;
import com.kaushal.teamtaskmanager.repository.TaskRepository;
import com.kaushal.teamtaskmanager.repository.UserRepository;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.LinkedHashMap;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class DashboardService {
	private final TaskRepository taskRepository;
	private final UserRepository userRepository;
	private final CurrentUserService currentUserService;

	@Transactional(readOnly = true)
	public DashboardResponse dashboard() {
		User current = currentUserService.user();
		Long scopedUserId = current.getRole() == Role.ADMIN ? null : current.getId();
		var tasks = taskRepository.searchFiltered(scopedUserId, null, null, null);
		long total = tasks.size();
		long completed = tasks.stream().filter(task -> task.getStatus() == TaskStatus.DONE).count();
		long overdue = tasks.stream()
				.filter(task -> task.getDueDate().isBefore(LocalDate.now()) && task.getStatus() != TaskStatus.DONE)
				.count();
		var byStatus = new LinkedHashMap<TaskStatus, Long>();
		Arrays.stream(TaskStatus.values()).forEach(status ->
				byStatus.put(status, tasks.stream().filter(task -> task.getStatus() == status).count()));
		var byPriority = new LinkedHashMap<TaskPriority, Long>();
		Arrays.stream(TaskPriority.values()).forEach(priority ->
				byPriority.put(priority, tasks.stream().filter(task -> task.getPriority() == priority).count()));
		var upcoming = tasks.stream()
				.filter(task -> !task.getDueDate().isBefore(LocalDate.now()))
				.sorted((left, right) -> left.getDueDate().compareTo(right.getDueDate()))
				.limit(6)
				.map(task -> new UpcomingDeadline(task.getTitle(), task.getAssignedTo().getName(), task.getDueDate(), task.getPriority()))
				.toList();
		var activity = tasks.stream()
				.sorted((left, right) -> right.getUpdatedAt().compareTo(left.getUpdatedAt()))
				.limit(8)
				.map(task -> new ActivityItem(
						task.getAssignedTo().getName() + " moved " + task.getTitle() + " to " + task.getStatus(),
						task.getStatus() == TaskStatus.DONE ? "success" : "info"))
				.toList();
		var users = current.getRole() == Role.ADMIN ? userRepository.findAll() : java.util.List.of(current);
		var performance = users.stream().map(user -> {
			long assigned = taskRepository.countByAssignedToId(user.getId());
			long done = taskRepository.countByAssignedToIdAndStatus(user.getId(), TaskStatus.DONE);
			int percent = assigned == 0 ? 0 : (int) Math.round((done * 100.0) / assigned);
			return new MemberPerformance(user.getId(), user.getName(), assigned, done, percent);
		}).toList();
		return new DashboardResponse(
				new Stats(total, completed, total - completed, overdue),
				byStatus,
				byPriority,
				tasks.stream().map(TaskResponse::from).toList(),
				activity,
				upcoming,
				performance);
	}
}
