package com.kaushal.teamtaskmanager.repository;

import com.kaushal.teamtaskmanager.entity.Task;
import com.kaushal.teamtaskmanager.entity.TaskPriority;
import com.kaushal.teamtaskmanager.entity.TaskStatus;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TaskRepository extends JpaRepository<Task, Long> {
	@Query("""
			select t from Task t
			where (:userId is null or t.assignedTo.id = :userId)
			and (:status is null or t.status = :status)
			and (:priority is null or t.priority = :priority)
			and (:assigneeId is null or t.assignedTo.id = :assigneeId)
			order by t.dueDate asc, t.priority desc
			""")
	List<Task> searchFiltered(
			@Param("userId") Long userId,
			@Param("status") TaskStatus status,
			@Param("priority") TaskPriority priority,
			@Param("assigneeId") Long assigneeId);

	@Query("""
			select t from Task t
			where (:userId is null or t.assignedTo.id = :userId)
			and (:status is null or t.status = :status)
			and (:priority is null or t.priority = :priority)
			and (:assigneeId is null or t.assignedTo.id = :assigneeId)
			and (
				lower(t.title) like lower(concat('%', :search, '%'))
				or lower(t.description) like lower(concat('%', :search, '%'))
			)
			order by t.dueDate asc, t.priority desc
			""")
	List<Task> searchFilteredWithText(
			@Param("userId") Long userId,
			@Param("status") TaskStatus status,
			@Param("priority") TaskPriority priority,
			@Param("assigneeId") Long assigneeId,
			@Param("search") String search);

	long countByStatus(TaskStatus status);

	long countByDueDateBeforeAndStatusNot(LocalDate dueDate, TaskStatus status);

	List<Task> findTop6ByDueDateGreaterThanEqualOrderByDueDateAsc(LocalDate today);

	List<Task> findByProjectIdOrderByDueDateAsc(Long projectId);

	void deleteByProjectId(Long projectId);

	void deleteByAssignedToId(Long assignedToId);

	long countByAssignedToId(Long assignedToId);

	long countByAssignedToIdAndStatus(Long assignedToId, TaskStatus status);
}
