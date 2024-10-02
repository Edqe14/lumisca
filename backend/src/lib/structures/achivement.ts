import { Session, SessionFactory } from './session';
import { Task } from './task';
import { TaskGroup, TaskGroupFactory } from './task-group';
import { User } from './user';

export type AchivementValidatorProps = {
  user: User;
  sessions?: Session[];
  taskGroups?: TaskGroup[];
  session?: Session;
  taskGroup?: TaskGroup;
  task?: Task;
};
export type AchivementValidator = (props: AchivementValidatorProps) => boolean;

export class Achivement {
  constructor(public name: string, public validator: AchivementValidator) {}
}

export class AchivementRegistry {
  static registry: Achivement[] = [
    // TODO: Add achivements
    new Achivement('NEWCOMER', () => true),
    new Achivement('ROAD_PLANNER', ({ taskGroups }) => {
      return !!(taskGroups && taskGroups.length > 0);
    }),
    new Achivement('ROAD_MASTER', ({ taskGroups }) => {
      return !!(taskGroups && taskGroups.length > 10);
    }),
    new Achivement('TASK_ADDICT', ({ taskGroups }) => {
      // complete 3 tasks
      return !!(
        taskGroups && taskGroups.some((tg) => tg.totalCompletedTasks >= 3)
      );
    }),
    new Achivement('SESSION_STARTER', ({ sessions, user }) => {
      return !!(sessions && sessions.some((s) => s.creator === user.id));
    }),
    new Achivement('STUDY_GROUP', ({ session }) => {
      return !!(session && session.memberCount > 1);
    }),
  ];

  static async trigger(
    props: AchivementValidatorProps,
    dontFetchAdditionalData = false
  ) {
    let roadmaps: TaskGroup[] | undefined;
    let sessions: Session[] | undefined;

    if (!dontFetchAdditionalData) {
      [roadmaps, sessions] = await Promise.all([
        TaskGroupFactory.getAll(props.user.id),
        SessionFactory.getAll(props.user.id),
      ]);
    }

    const achivements: string[] = [];

    for (const achivement of this.registry) {
      if (
        achivement.validator({ ...props, taskGroups: roadmaps, sessions }) &&
        !(props.user.achivements ?? {})[achivement.name]
      ) {
        console.log(`Achivement unlocked: ${achivement.name}`);
        achivements.push(achivement.name);
      }
    }

    await props.user.grantAchievement(achivements);
  }
}
