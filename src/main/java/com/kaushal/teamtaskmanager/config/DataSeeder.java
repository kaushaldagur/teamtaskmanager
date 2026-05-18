package com.kaushal.teamtaskmanager.config;

import com.kaushal.teamtaskmanager.entity.Project;
import com.kaushal.teamtaskmanager.entity.Role;
import com.kaushal.teamtaskmanager.entity.Task;
import com.kaushal.teamtaskmanager.entity.TaskPriority;
import com.kaushal.teamtaskmanager.entity.TaskStatus;
import com.kaushal.teamtaskmanager.entity.User;
import com.kaushal.teamtaskmanager.repository.ProjectRepository;
import com.kaushal.teamtaskmanager.repository.TaskRepository;
import com.kaushal.teamtaskmanager.repository.UserRepository;
import java.time.LocalDate;
import java.util.LinkedHashSet;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
@RequiredArgsConstructor
public class DataSeeder {
	private final UserRepository userRepository;
	private final ProjectRepository projectRepository;
	private final TaskRepository taskRepository;
	private final PasswordEncoder passwordEncoder;

	@Bean
	CommandLineRunner seedDemoData() {
		return args -> {
			if (userRepository.count() > 0) {
				userRepository.findByEmail("admin@ethara.dev").ifPresent(admin -> {
					admin.setName("Kaushal Dagur");
					userRepository.save(admin);
				});
				return;
			}
			User admin = userRepository.save(User.builder()
					.name("Kaushal Dagur")
					.email("admin@ethara.dev")
					.password(passwordEncoder.encode("password123"))
					.role(Role.ADMIN)
					.build());
			User rohan = userRepository.save(User.builder()
					.name("Rohan Mehta")
					.email("rohan@ethara.dev")
					.password(passwordEncoder.encode("password123"))
					.role(Role.MEMBER)
					.build());
			User anaya = userRepository.save(User.builder()
					.name("Anaya Mehta")
					.email("anaya@ethara.dev")
					.password(passwordEncoder.encode("password123"))
					.role(Role.MEMBER)
					.build());
			Project launch = projectRepository.save(Project.builder()
					.name("Ethara Launch Workspace")
					.description("Premium SaaS dashboard, task intelligence, role workflows, and delivery analytics.")
					.deadline(LocalDate.now().plusDays(21))
					.createdBy(admin)
					.members(new LinkedHashSet<>(Set.of(admin, rohan, anaya)))
					.build());
			Project mobile = projectRepository.save(Project.builder()
					.name("Mobile Companion Beta")
					.description("Companion experience for quick task updates, deadline review, and team check-ins.")
					.deadline(LocalDate.now().plusDays(45))
					.createdBy(admin)
					.members(new LinkedHashSet<>(Set.of(admin, anaya)))
					.build());
			taskRepository.save(Task.builder()
					.title("Design analytics cards")
					.description("Create production-grade stat cards with priority, deadline, and status signals.")
					.priority(TaskPriority.HIGH)
					.status(TaskStatus.DONE)
					.dueDate(LocalDate.now().plusDays(2))
					.assignedTo(anaya)
					.project(launch)
					.tags(Set.of("dashboard", "ui"))
					.build());
			taskRepository.save(Task.builder()
					.title("Implement JWT auth flow")
					.description("Signup, login, BCrypt password storage, and bearer-token authorization.")
					.priority(TaskPriority.URGENT)
					.status(TaskStatus.IN_PROGRESS)
					.dueDate(LocalDate.now().plusDays(1))
					.assignedTo(rohan)
					.project(launch)
					.tags(Set.of("backend", "security"))
					.build());
			taskRepository.save(Task.builder()
					.title("Build Kanban board API")
					.description("Expose task filtering by status, assignee, priority, search, and project.")
					.priority(TaskPriority.HIGH)
					.status(TaskStatus.TODO)
					.dueDate(LocalDate.now().plusDays(6))
					.assignedTo(rohan)
					.project(launch)
					.tags(Set.of("tasks", "kanban"))
					.build());
			taskRepository.save(Task.builder()
					.title("Prototype notification center")
					.description("Prepare event payloads for task assigned, project created, and task completed toasts.")
					.priority(TaskPriority.MEDIUM)
					.status(TaskStatus.TODO)
					.dueDate(LocalDate.now().plusDays(10))
					.assignedTo(anaya)
					.project(mobile)
					.tags(Set.of("notifications"))
					.build());
		};
	}
}
