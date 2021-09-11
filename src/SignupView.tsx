import ForgeUI, {
  Button,
  Fragment,
  Text,
  Table,
  Head,
  Row,
  Cell,
  Form,
  TextField,
  useProductContext,
  useConfig,
} from '@forge/ui'
import { useContentProperty } from '@forge/ui-confluence'
import { EntryData } from './types'
import api, { route } from '@forge/api'

const SignupView = () => {
  const { title, fields, ...rest } = useConfig() || {}
  const fieldLabels = fields
    ? fields.split(',').map((label) => label.trim())
    : Object.entries(rest)
        .sort((a, b) => Number(b.slice(0, -5)) - Number(a.slice(0, -5)))
        .map(([, value]) => value)
        .filter((label) => label !== '')
  const { accountId } = useProductContext()
  const [entries, updateEntries] = useContentProperty<EntryData[]>(
    'entries',
    [],
  )
  const hasSubmitted =
    entries.find((entry) => entry.accountId === accountId) !== undefined

  return (
    <Fragment>
      {hasSubmitted ? (
        <Fragment>
          <Text>{`You have signed up${title ? ` for ${title}` : ''}! ✅`}</Text>
          <Button
            text="Remove yourself from this list ⛔️"
            onClick={async () => {
              await updateEntries((prev) => {
                return prev.filter((row) => row.accountId !== accountId)
              })
            }}
          />
        </Fragment>
      ) : fieldLabels.length > 0 ? (
        <Form
          onSubmit={async (formData) => {
            const data = await (
              await api.asUser().requestJira(route`/rest/api/3/myself`)
            ).json()
            await updateEntries((prev) => {
              return [
                ...prev,
                { ...formData, name: data.displayName, accountId },
              ]
            })
          }}
          submitButtonText={`Sign up ${title ? `for ${title} ` : ''}🎉`}
        >
          {fieldLabels.length > 0 && (
            <Text>
              {' '}
              "**Please fill in the following information before signing up**"{' '}
            </Text>
          )}
          {fieldLabels.map((field) => (
            <TextField name={field} label={field} />
          ))}
        </Form>
      ) : (
        <Button
          text={`Sign up ${title ? `for ${title} ` : ''}🎉`}
          onClick={async () => {
            const data = await (
              await api.asUser().requestJira(route`/rest/api/3/myself`)
            ).json()
            await updateEntries((prev) => {
              return [...prev, { name: data.displayName, accountId }]
            })
          }}
        />
      )}
      {entries.length > 0 && (
        <Fragment>
          <Table>
            <Head>
              <Cell>
                <Text> "**Name**" </Text>
              </Cell>
              {fieldLabels.map((field) => (
                <Cell>
                  <Text> {`**${field}**`} </Text>
                </Cell>
              ))}
            </Head>
            {entries
              .filter(function (item, index, array) {
                return item.accountId === accountId
              })
              .map((entry) => (
                <Row>
                  <Cell>
                    <Text>
                      {`[${entry.name}](/wiki/people/${entry.accountId})`}
                    </Text>
                  </Cell>
                  {fieldLabels.map((field) => (
                    <Cell>
                      <Text> {entry[field] || ''} </Text>
                    </Cell>
                  ))}
                </Row>
              ))}
          </Table>
        </Fragment>
      )}
    </Fragment>
  )
}

export default SignupView
