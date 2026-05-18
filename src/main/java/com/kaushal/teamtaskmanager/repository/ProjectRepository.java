package com.kaushal.teamtaskmanager.repository;

import com.kaushal.teamtaskmanager.entity.Project;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ProjectRepository extends JpaRepository<Project, Long> {
	@Query("""
			select distinct p from Project p
			left join fetch p.members m
			where p.createdBy.id = :userId or m.id = :userId
			order by p.deadline asc
			""")
	List<Project> findVisibleToUser(@Param("userId") Long userId);
}
