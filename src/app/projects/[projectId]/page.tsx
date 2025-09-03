interface Props {
  params: { projectId: string };
}
export default function Page({ params }: Props) {
  const { projectId } = params;
  return <div>{projectId}</div>;
}
