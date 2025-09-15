---
id: upgrade-1-1-x
title: Upgrading to 1.1.x from 1.0.x
sidebar_label: Upgrading to 1.1.x
---

In 1.1.0 the way regularisation rules are applied has been significantly altered because in some circumstances rules
were not being applied as users (and the developer) intended. The problem stemmed from the way rules were divided into
pre- and post-collation rules. The distinction between pre- and post-collate rules was always internal to the collation
editor and was determined based on whether or not the application of the rule changed the value of the token to be sent
to collateX. This distinction meant that pre-collation rules were not always being applied if they were made after a
post-collation rule for the same word. This lead to confusion for several users.

In 1.1.0 the pre- post-collation distinction has been scrapped to remove this problem with rule chaining. This is the
regularisation system which any new projects should be using.

It is recommended that projects which started regularising on a version before 1.1.x including those started on the now
deprecated code continue to use the older system. This has been preserved in a separate repository and can be run in
parallel with the new system so different projects can use different regularisation applications. The risk of using the
new system for existing projects is that rules which had been created but had never previously been applied to the data
with the old system might be applied in the new system. In many, perhaps most, cases this will not make any difference.
However, in some cases it might. It could change the visible token or the classification of a
regularisation/subreading. The decision will need to be taken on a project by project basis for existing projects
taking into account the stage the project has reached and in consultation with the project editors.

No further changes are required to upgrade to 1.1.x from a 1.0.x version.

To run the legacy version instead of or as well as the new version see the documentation in the
[legacy_regularisation repository](https://github.com/itsee-birmingham/legacy_regularisation).
